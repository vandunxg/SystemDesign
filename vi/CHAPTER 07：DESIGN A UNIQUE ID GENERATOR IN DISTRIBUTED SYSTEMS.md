# Chương 07: Thiết kế bộ tạo ID duy nhất trong hệ thống phân tán



Trong chương này, yêu cầu đặt ra là thiết kế một bộ tạo ID duy nhất trong hệ thống phân tán. Ý tưởng đầu tiên của bạn có thể là sử dụng khóa chính có thuộc tính `auto\_increment` trong database truyền thống. Tuy nhiên, `auto\_increment` không hoạt động trong môi trường phân tán, vì một database server đơn lẻ không đủ lớn, còn việc tạo ID duy nhất trên nhiều database với độ trễ tối thiểu là một thách thức. Dưới đây là một số ví dụ về ID duy nhất:

![](images/chapter7/figure7-1.jpg)

### Bước 1: Hiểu vấn đề và xác định phạm vi thiết kế

Hiểu rõ vấn đề là bước đầu tiên để giải quyết bất kỳ câu hỏi phỏng vấn system design nào. Dưới đây là một ví dụ về cuộc trao đổi giữa ứng viên và người phỏng vấn:

Ứng viên: ID duy nhất có những đặc điểm gì?

Người phỏng vấn: ID phải là duy nhất và có thể sắp xếp được.

Ứng viên: ID có tăng thêm 1 sau mỗi khi thêm một bản ghi không?

Người phỏng vấn: ID tăng theo thời gian, không nhất thiết chỉ tăng thêm 1; ID được tạo vào buổi tối sẽ lớn hơn ID được tạo vào buổi sáng.

Ứng viên: ID có chỉ bao gồm các giá trị số không?

Người phỏng vấn: Đúng vậy.

Ứng viên: ID cần có độ dài bao nhiêu?

Người phỏng vấn: ID phải phù hợp với 64 bit.

Ứng viên: Quy mô của hệ thống là bao nhiêu?

Người phỏng vấn: Hệ thống phải có khả năng tạo 10000 ID mỗi giây.

Trên đây là một số câu hỏi mẫu có thể đặt ra cho người phỏng vấn. Việc hiểu rõ yêu cầu và làm rõ những điểm mơ hồ là rất quan trọng.

Đối với bài phỏng vấn này, các yêu cầu là:

* ID phải là duy nhất.
* ID chỉ là giá trị số.
* ID phù hợp với 64 bit.
* ID được sắp xếp theo ngày.
* Có khả năng tạo hơn 10,000 ID duy nhất mỗi giây.

### Bước 2: Đề xuất thiết kế cấp cao và nhận được sự đồng thuận

Có thể sử dụng nhiều phương án để tạo ID duy nhất trong hệ thống phân tán.

Các phương án chúng ta xem xét gồm:

* Multi-leader replication
* Universally unique identifier (UUID)
* Ticket server
* Twitter Snowflake

Hãy cùng xem chúng hoạt động như thế nào, cũng như ưu và nhược điểm của từng phương án.

#### Multi-leader replication

Như trong Hình 7-2, phương án đầu tiên là multi-leader replication.

![](images/chapter7/figure7-2.jpg)

Phương pháp này sử dụng tính năng `auto\_increment` của database. Thay vì tăng ID tiếp theo thêm 1, chúng ta tăng nó thêm k, trong đó k là số lượng database server đang được sử dụng. Như minh họa trong Hình 7-2, ID tiếp theo cần tạo bằng ID trước đó trên cùng server cộng thêm 2. Điều này giải quyết một số vấn đề về khả năng mở rộng, vì ID có thể mở rộng theo số lượng database server.

Tuy nhiên, chiến lược này có một số nhược điểm chính:

* Khó mở rộng qua nhiều data center
* ID không tăng theo thời gian trên nhiều server
* Không mở rộng tốt khi thêm hoặc xóa server

#### UUID

UUID là một cách đơn giản khác để lấy ID duy nhất. UUID là một số 128 bit dùng để nhận diện thông tin trong hệ thống máy tính. Xác suất UUID bị trùng là rất thấp. Theo Wikipedia, "nếu tạo 1 tỷ UUID mỗi giây, xác suất tạo ra một bản trùng lặp sẽ đạt 50% sau khoảng 100 năm" \[1\] .

Dưới đây là một ví dụ về UUID: 09c93e62-50b4-468d-bf8a-c07e1040bfb2. UUID có thể được tạo độc lập mà không cần các server phối hợp với nhau. Hình 7-3 minh họa thiết kế của UUID.

![](images/chapter7/figure7-3.jpg)

Trong thiết kế này, mỗi Web server có một bộ tạo ID, và Web server chịu trách nhiệm tự tạo ID.

**Ưu điểm:**

* Tạo UUID rất đơn giản. Các server không cần phối hợp, nên không phát sinh vấn đề đồng bộ.
* Hệ thống dễ mở rộng vì mỗi Web server chịu trách nhiệm tạo các ID mà nó sử dụng. Bộ tạo ID có thể dễ dàng mở rộng cùng với Web server.

**Nhược điểm:**

* ID dài 128 bit, trong khi yêu cầu của chúng ta là 64 bit.
* ID không tăng theo thời gian
* ID có thể không phải là số.

#### Ticket server

Ticket server là một cách thú vị khác để tạo ID duy nhất. `Flickr` đã phát triển ticket server để tạo distributed primary key\[2]. Đáng chú ý là cách hệ thống này hoạt động.

![](images/chapter7/figure7-4.jpg)

Ý tưởng là sử dụng một tính năng auto-increment tập trung trên một database server duy nhất (Ticket Server). Để biết thêm thông tin, hãy tham khảo bài viết trên blog kỹ thuật của Flickr \[2\] .

**Ưu điểm:**

* ID dạng số
* Dễ triển khai, phù hợp với các ứng dụng vừa và nhỏ

**Nhược điểm:**

* Single point of failure. Một ticket server duy nhất có nghĩa là nếu ticket server gặp sự cố, mọi hệ thống phụ thuộc vào nó đều sẽ gặp vấn đề. Để tránh single point of failure, chúng ta có thể thiết lập nhiều ticket server. Tuy nhiên, điều này sẽ tạo ra những thách thức mới, chẳng hạn như đồng bộ dữ liệu.

#### Twitter Snowflake

Các phương pháp trên cho chúng ta một số ý tưởng về cách những hệ thống tạo ID khác nhau hoạt động. Tuy nhiên, không phương pháp nào đáp ứng các yêu cầu cụ thể của chúng ta; vì vậy, chúng ta cần một phương pháp khác. Hệ thống tạo ID duy nhất "snowflake" của Twitter \[3\] mang lại nhiều gợi ý hữu ích và có thể đáp ứng các yêu cầu của chúng ta.

Chia để trị là người bạn đồng hành của chúng ta. Thay vì tạo trực tiếp một ID, chúng ta chia ID thành các phần khác nhau. Hình 7-5 cho thấy cấu trúc của một ID 64 bit.

![](images/chapter7/figure7-5.jpg)

Giải thích từng phần như sau:

* Bit dấu: 1 bit, luôn có giá trị 0. Bit này được dành cho mục đích sử dụng trong tương lai. Về lý thuyết, nó có thể được dùng để phân biệt số có dấu và số không dấu.
* Timestamp: 41 bit. Số mili giây kể từ epoch hoặc custom epoch. Chúng ta sử dụng epoch mặc định của Twitter Snowflake là 1288834974657, tương đương 01:42:54 UTC ngày 4 tháng 11 năm 2010.
* Data center ID: 5 bit, cho phép có $$2 ^ 5 = 32$$ data center.
* Machine ID: 5 bit, mỗi data center có $$2 ^ 5 = 32$$ machine
* Sequence number: 12 bit. Sequence number tăng thêm 1 với mỗi ID được tạo trên machine/process đó. Giá trị này được đặt lại về 0 sau mỗi mili giây.

### Bước 3: Đi sâu vào thiết kế

Trong thiết kế cấp cao, chúng ta đã thảo luận về nhiều phương án thiết kế bộ tạo ID duy nhất trong hệ thống phân tán. Chúng ta đã xác định một phương pháp dựa trên bộ tạo ID Twitter Snowflake. Hãy đi sâu hơn vào thiết kế này. Để gợi nhớ, sơ đồ thiết kế được đưa lại bên dưới.

![](images/chapter7/figure7-6.jpg)

Data center ID và machine ID được chọn khi khởi động và thường được cố định sau khi hệ thống đi vào hoạt động. Mọi thay đổi đối với data center ID và machine ID đều cần được xem xét cẩn thận, vì những thay đổi ngoài ý muốn đối với các giá trị này có thể dẫn đến xung đột ID. Timestamp và sequence number được tạo trong thời gian bộ tạo ID hoạt động.

#### Timestamp

41 bit quan trọng nhất tạo thành phần timestamp. Vì timestamp tăng theo thời gian, ID có thể được sắp xếp theo thời gian.

Hình 7-7 cho thấy một ví dụ về cách chuyển đổi biểu diễn nhị phân sang UTC. Bạn cũng có thể sử dụng phương pháp tương tự để chuyển UTC ngược lại thành biểu diễn nhị phân.

![](images/chapter7/figure7-7.jpg)

Timestamp lớn nhất có thể biểu diễn bằng 41 bit là: $$2 ^ {41} - 1 = 2199023255551 ms$$, từ đó chúng ta có: $$\approx 69 năm=2199023255551 ms/1000 giây/365 ngày/24 giờ/3600 giây$$.

Điều này có nghĩa là bộ tạo ID sẽ hoạt động trong 69 năm, và sử dụng custom epoch có thời điểm gần với ngày hiện tại sẽ trì hoãn thời điểm tràn. Sau 69 năm, chúng ta sẽ cần một epoch mới hoặc áp dụng kỹ thuật khác để migrate ID.

#### Sequence number

Sequence number có 12 bit, cho chúng ta $$\mathbf{2 ^ {12} = 4096}$$ tổ hợp. Trường này có giá trị 0, trừ khi nhiều ID được tạo trên cùng một server trong một mili giây. Về lý thuyết, một machine có thể hỗ trợ tối đa 4096 ID mới mỗi mili giây.

### Bước 4: Tóm tắt

Trong chương này, chúng ta đã thảo luận về các phương pháp khác nhau để thiết kế bộ tạo ID duy nhất: multi-leader replication, UUID, ticket server và bộ tạo ID duy nhất tương tự Twitter Snowflake. Chúng ta chọn Snowflake vì nó hỗ trợ tất cả use case của chúng ta và có khả năng mở rộng trong môi trường phân tán.

Nếu còn thời gian sau khi kết thúc phỏng vấn, dưới đây là một số điểm có thể trao đổi thêm:

* Đồng bộ clock. Trong thiết kế của chúng ta, chúng ta giả định các server tạo ID có cùng clock. Giả định này có thể không đúng khi server chạy trên nhiều kernel. Thách thức tương tự cũng tồn tại trong kịch bản nhiều data center. Giải pháp cho việc đồng bộ clock nằm ngoài phạm vi của cuốn sách; tuy nhiên, điều quan trọng là phải biết vấn đề này tồn tại. Network Time Protocol là giải pháp phổ biến nhất cho vấn đề này. Độc giả quan tâm có thể tham khảo tài liệu tham khảo \[4\].
* Điều chỉnh độ dài các phần. Ví dụ, ít sequence number hơn nhưng nhiều bit timestamp hơn sẽ phù hợp với ứng dụng có mức độ concurrency thấp và thời gian sử dụng dài.
* High availability. Vì bộ tạo ID là một hệ thống nhiệm vụ quan trọng, nó phải có high availability

Chúc mừng bạn đã đi đến đây! Hãy tự động viên mình một chút, bạn đã làm rất tốt!

### Tài liệu tham khảo

\[1\] Universally unique identifier: [https://en.wikipedia.org/wiki/Universally\_unique\_identifier](https://en.wikipedia.org/wiki/Universally\_unique\_identifier)

\[2\] Ticket Servers: Distributed Unique Primary Keys on the Cheap:[https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap](https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap)

\[3\] Announcing Snowflake: [https://blog.twitter.com/engineering/en\_us/a/2010/announcing-snowflake.html](https://blog.twitter.com/engineering/en\_us/a/2010/announcing-snowflake.html)

\[4\] Network time protocol: [https://en.wikipedia.org/wiki/Network\_Time\_Protocol](https://en.wikipedia.org/wiki/Network\_Time\_Protocol)
