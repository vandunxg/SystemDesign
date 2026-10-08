# Chương 06: Thiết kế kho key-value


Kho key-value, còn được gọi là database key-value, là một loại database phi quan hệ. Mỗi định danh duy nhất được lưu dưới dạng một key cùng với value tương ứng. Cặp dữ liệu này được gọi là một cặp “key-value”.

Trong một cặp key-value, key phải là duy nhất; thông qua key, ta có thể truy cập value tương ứng. Key có thể là văn bản thuần túy hoặc giá trị hash. Vì lý do hiệu năng, key ngắn sẽ hoạt động tốt hơn. Key có thể trông như thế nào?

* Key văn bản thuần túy: “last\_logged\_in\_at”
* Key hash: 253DDEC4

Value trong cặp key-value có thể là string, list, object, v.v. Trong kho key-value, value thường được xem là một object opaque, như trong Amazon dynamo \[1], Memcached \[2], Redis \[3], v.v.

Dưới đây là một phần dữ liệu trong kho key-value:

![](../images/chapter6/table6-1.jpg)

Trong chương này, bạn sẽ thiết kế một kho key-value hỗ trợ các thao tác sau:

* `put(key, value)` // chèn “value” được liên kết với “key”
* `get(key)` // lấy “value” được liên kết với “key”

### Hiểu bài toán và xác định phạm vi thiết kế

Không có thiết kế hoàn hảo. Mỗi thiết kế đều có những đánh đổi nhất định giữa việc đọc, ghi và sử dụng bộ nhớ. Ta cũng phải đánh đổi giữa tính nhất quán và tính khả dụng.

Trong chương này, chúng ta thiết kế một kho key-value có các đặc điểm sau:

* Kích thước của cặp key-value nhỏ: dưới 10 KB.
* Có khả năng lưu trữ dữ liệu lớn.
* Tính khả dụng cao: hệ thống phản hồi nhanh, ngay cả khi xảy ra lỗi.
* Khả năng mở rộng cao: hệ thống có thể scale để hỗ trợ các tập dữ liệu lớn.
* Tự động scale: server được thêm vào hoặc loại bỏ dựa trên lưu lượng một cách tự động.
* Tính nhất quán có thể điều chỉnh.
* Độ trễ thấp.

### Kho key-value trên một server duy nhất

Phát triển một kho key-value nằm trên một server duy nhất khá dễ. Một cách trực quan là lưu các cặp key-value trong một hash table, giữ toàn bộ dữ liệu trong bộ nhớ.

Để chứa nhiều dữ liệu hơn trên một server, có thể thực hiện hai tối ưu hóa:

```
- Nén dữ liệu
- Chỉ lưu dữ liệu thường xuyên được sử dụng trong memory, phần còn lại lưu trên disk
```

Ngay cả sau những tối ưu hóa này, một server duy nhất vẫn có thể nhanh chóng đạt đến giới hạn dung lượng. Cần có một kho key-value phân tán để hỗ trợ dữ liệu lớn.

### Kho key-value phân tán

Kho key-value phân tán còn được gọi là distributed hash table. Nó phân phối các cặp key-value trên nhiều server. Khi thiết kế hệ thống phân tán, việc hiểu định lý CAP (C - Consistency, A - Availability, P - Partition tolerance) rất quan trọng.

Định lý CAP nói rằng một hệ thống phân tán không thể đồng thời cung cấp quá hai trong ba đảm bảo sau: tính nhất quán, tính khả dụng và khả năng chịu phân vùng. Hãy làm rõ một số định nghĩa.

**Tính nhất quán**: Tính nhất quán nghĩa là mọi client đều nhìn thấy cùng một dữ liệu tại cùng một thời điểm, bất kể chúng kết nối đến node nào.

**Tính khả dụng**: Tính khả dụng nghĩa là mọi client yêu cầu dữ liệu đều nhận được response, ngay cả khi một số node đã ngừng hoạt động.

**Khả năng chịu phân vùng**: Phân vùng là tình trạng kết nối giữa hai node bị gián đoạn; khả năng chịu phân vùng nghĩa là hệ thống tiếp tục hoạt động khi mạng bị phân vùng.

Định lý CAP chỉ ra rằng để hỗ trợ 2 trong 3 thuộc tính, ta phải hy sinh một thuộc tính, như minh họa trong hình 6-1:

Ngày nay, các kho key-value được phân loại dựa trên hai đặc tính CAP mà chúng hỗ trợ:

![](../images/chapter6/figure6-1.jpg)

**Hệ thống CP (Consistency và Partition tolerance)**: Kho key-value CP hỗ trợ tính nhất quán và khả năng chịu phân vùng, đồng thời hy sinh tính khả dụng.

**Hệ thống AP (Availability và Partition tolerance)**: Kho key-value AP hỗ trợ tính khả dụng và khả năng chịu phân vùng, đồng thời hy sinh tính nhất quán.

**Hệ thống CA (Consistency và Availability)**: Kho key-value CA hỗ trợ tính nhất quán và tính khả dụng, đồng thời hy sinh khả năng chịu phân vùng. Vì lỗi mạng là không thể tránh khỏi, hệ thống phân tán phải chịu được việc mạng bị phân vùng. Do đó, hệ thống CA không thể tồn tại trong các ứng dụng thực tế.

Phần trên chủ yếu là các định nghĩa. Để dễ hiểu hơn, hãy xem một vài ví dụ cụ thể. Trong hệ thống phân tán, dữ liệu thường được nhân bản nhiều lần. Giả sử dữ liệu được nhân bản trên ba node replica n1, n2 và n3, như minh họa trong hình 6-2.

*   **Trường hợp lý tưởng**

    Trong thế giới lý tưởng, phân vùng mạng không bao giờ xảy ra. Dữ liệu ghi vào n1 sẽ tự động được sao chép sang n2 và n3. Tính nhất quán và tính khả dụng đều được đảm bảo.

    ![](../images/chapter6/figure6-2.jpg)
*   **Hệ thống phân tán trong thế giới thực**

    Trong hệ thống phân tán, phân vùng là không thể tránh khỏi. Khi phân vùng xảy ra, ta phải lựa chọn giữa tính nhất quán và tính khả dụng. Trong hình 6-3, n3 ngừng hoạt động và không thể giao tiếp với n1, n2. Nếu client ghi dữ liệu vào n1 hoặc n2, dữ liệu không thể truyền đến n3. Nếu dữ liệu được ghi vào n3 nhưng chưa truyền đến n1 và n2, n1 và n2 sẽ chứa dữ liệu cũ.

    ![](../images/chapter6/figure6-3.jpg)

    Nếu chọn tính nhất quán cao hơn tính khả dụng (hệ thống CP), ta phải chặn mọi thao tác ghi vào n1 và n2 để tránh dữ liệu giữa ba server không nhất quán, khiến hệ thống không khả dụng. Hệ thống ngân hàng thường có yêu cầu cực kỳ cao về tính nhất quán. Ví dụ, hiển thị số dư mới nhất là điều thiết yếu với hệ thống ngân hàng. Nếu xảy ra tình trạng không nhất quán do phân vùng mạng, hệ thống ngân hàng sẽ trả về lỗi cho đến khi vấn đề được giải quyết.

    Tuy nhiên, nếu chọn tính khả dụng cao hơn tính nhất quán (hệ thống AP), hệ thống sẽ tiếp tục chấp nhận thao tác đọc, dù có thể trả về dữ liệu cũ. Với thao tác ghi, n1 và n2 sẽ tiếp tục chấp nhận dữ liệu ghi; khi phân vùng mạng được giải quyết, dữ liệu sẽ được đồng bộ sang n3.

    Chọn CAP phù hợp với use case là một bước quan trọng khi xây dựng kho key-value phân tán. Bạn có thể thảo luận vấn đề này với interviewer rồi thiết kế hệ thống tương ứng.

### Các thành phần hệ thống

Trong phần này, chúng ta sẽ thảo luận các thành phần và kỹ thuật cốt lõi sau để xây dựng kho key-value:

* Phân vùng dữ liệu
* Nhân bản dữ liệu
* Tính nhất quán
* Giải quyết tình trạng không nhất quán
* Xử lý lỗi
* Sơ đồ kiến trúc hệ thống
* Write path
* Read path

Nội dung dưới đây chủ yếu dựa trên ba hệ thống kho key-value phổ biến: Dynamo \[4], Cassandra \[5] và BigTable \[6].

### Phân vùng dữ liệu

Đối với các ứng dụng lớn, việc đặt toàn bộ tập dữ liệu trên một server duy nhất là không khả thi. Cách đơn giản nhất để giải quyết vấn đề này là chia dữ liệu thành các partition nhỏ hơn rồi lưu chúng trên nhiều server. Có hai thách thức khi phân vùng dữ liệu:

* Phân phối dữ liệu đồng đều trên nhiều server.
* Giảm thiểu việc di chuyển dữ liệu khi node được thêm vào hoặc xóa đi.

Consistent hashing được thảo luận trong Chương 5 là một kỹ thuật tốt để giải quyết các vấn đề này. Hãy xem lại cách consistent hashing hoạt động ở mức khái quát.

* Đầu tiên, các server được đặt trên một hash ring. Trong hình 6-4, 8 server lần lượt được ký hiệu là s0, s1, ..., s7 và được đặt trên hash ring.
*   Tiếp theo, một key được hash vào cùng ring đó và được lưu trên server đầu tiên gặp phải khi di chuyển theo chiều kim đồng hồ. Ví dụ, key0 được lưu trên s1 theo logic này.

    ![](../images/chapter6/figure6-4.jpg)

Dùng consistent hashing để phân vùng dữ liệu có các ưu điểm sau:

* Tự động scale: có thể tự động thêm và xóa server dựa trên tải.
* Tính không đồng nhất: số virtual node của server tỷ lệ thuận với dung lượng của server. Ví dụ, server có dung lượng lớn hơn sẽ được phân bổ nhiều virtual node hơn.

### Nhân bản dữ liệu

Để đạt tính khả dụng và độ tin cậy cao, dữ liệu phải được nhân bản bất đồng bộ trên N server, trong đó N là một tham số có thể cấu hình. Logic chọn N server này như sau: sau khi ánh xạ key vào một vị trí trên hash ring, đi theo chiều kim đồng hồ từ vị trí đó và chọn N server đầu tiên trên ring để lưu các bản sao dữ liệu. Trong hình 6-5 (N = 3), key0 được nhân bản sang s1, s2 và s3.

![](../images/chapter6/figure6-5.jpg)

Với virtual node, N node đầu tiên trên ring có thể thuộc về ít hơn N server vật lý. Để tránh vấn đề này, khi thực hiện logic di chuyển theo chiều kim đồng hồ, ta chỉ chọn các server duy nhất.

Do mất điện, sự cố mạng, thiên tai và các nguyên nhân khác, các node trong cùng một data center thường bị lỗi đồng thời. Để tăng độ tin cậy, các replica được đặt tại những data center khác nhau, và các data center được kết nối với nhau qua mạng tốc độ cao.

### Tính nhất quán

Vì dữ liệu được nhân bản trên nhiều node, các replica phải được đồng bộ với nhau. Quorum consensus có thể đảm bảo tính nhất quán của các thao tác đọc và ghi. Trước hết, hãy thống nhất một số định nghĩa.

N = số lượng replica

W = write quorum có kích thước W. Để thao tác ghi được xem là thành công, phải có W replica xác nhận thao tác ghi.

R = read quorum có kích thước R. Để thao tác đọc được xem là thành công, nó phải chờ response từ ít nhất R replica.

Hãy xem ví dụ trong hình 6-6, trong đó N = 3.

![](../images/chapter6/figure6-6.jpg)

W = 1 không có nghĩa là dữ liệu chỉ được ghi trên một server. Ví dụ, trong cấu hình ở hình 6-6, dữ liệu được nhân bản sang s0, s1 và s2. W = 1 nghĩa là coordinator chỉ cần nhận được ít nhất một xác nhận để xem thao tác ghi là thành công. Ví dụ, nếu nhận được xác nhận từ s1, ta không cần chờ xác nhận từ s0 và s2 nữa. Coordinator đóng vai trò proxy giữa client và các node.

Cấu hình W, R và N là một đánh đổi điển hình giữa độ trễ và tính nhất quán. Nếu W = 1 hoặc R = 1, thao tác sẽ trả về nhanh vì coordinator chỉ cần chờ response từ một replica. Nếu W hoặc R > 1, hệ thống cung cấp tính nhất quán tốt hơn; tuy nhiên, query sẽ chậm hơn vì coordinator phải chờ response từ replica chậm nhất.

Nếu W+R>N, tính nhất quán mạnh được đảm bảo vì ít nhất một node giao nhau sẽ có dữ liệu mới nhất, qua đó đảm bảo tính nhất quán.

Cấu hình N, W và R như thế nào để phù hợp với use case của chúng ta?

Dưới đây là một số cấu hình có thể dùng:

* Nếu R=1, W=N, hệ thống được tối ưu cho việc đọc nhanh.
* Nếu W=1, R=N, hệ thống được tối ưu cho việc ghi nhanh.
* Nếu W+R>N, tính nhất quán mạnh được đảm bảo (thường là N=3, W=R=2).
* Nếu W+R<=N, tính nhất quán mạnh không được đảm bảo.

Tùy theo yêu cầu, ta có thể điều chỉnh các giá trị W, R, N để đạt mức nhất quán mong muốn.

### Mô hình nhất quán

Mô hình nhất quán là một yếu tố quan trọng khác cần cân nhắc khi thiết kế kho key-value. Mô hình nhất quán định nghĩa mức độ nhất quán của dữ liệu; có nhiều mô hình nhất quán khác nhau:

* Nhất quán mạnh: mọi thao tác đọc đều trả về giá trị tương ứng với kết quả của item dữ liệu được ghi mới nhất. Client không bao giờ nhìn thấy dữ liệu cũ.
* Nhất quán yếu: các thao tác đọc tiếp theo có thể không nhìn thấy giá trị mới nhất.
* Nhất quán cuối cùng: đây là một dạng đặc biệt của nhất quán yếu. Nếu có đủ thời gian, mọi update sẽ được truyền đi và tất cả replica sẽ trở nên nhất quán.

Nhất quán mạnh thường được thực hiện bằng cách buộc một replica không chấp nhận thao tác đọc/ghi mới cho đến khi mọi replica đồng thuận về thao tác ghi hiện tại. Cách này không lý tưởng cho hệ thống có tính khả dụng cao vì có thể chặn các thao tác mới. Dynamo và Cassandra sử dụng nhất quán cuối cùng; đây là mô hình nhất quán mà chúng ta khuyến nghị cho kho key-value.

Xét các thao tác ghi đồng thời, nhất quán cuối cùng cho phép các value không nhất quán đi vào hệ thống và buộc client phải đọc các value này để hòa giải chúng. Phần tiếp theo sẽ giải thích cách quá trình hòa giải hoạt động cùng với việc quản lý version.

### Giải quyết tình trạng không nhất quán: quản lý version

Nhân bản giúp tăng tính khả dụng, nhưng gây ra tình trạng không nhất quán giữa các replica. **Quản lý version** và **vector clock** được dùng để giải quyết vấn đề này. Versioning nghĩa là xem mỗi lần sửa đổi dữ liệu như một version dữ liệu mới, bất biến. Trước khi nói về quản lý version, hãy dùng một ví dụ để giải thích tình trạng không nhất quán xảy ra như thế nào:

Như trong hình 6-7, các node replica n1 và n2 có cùng một value. Ta gọi value này là giá trị ban đầu. server 1 và server 2 nhận được cùng một value thông qua thao tác get(“name”).

![](../images/chapter6/figure6-7.jpg)

Tiếp theo, server 1 đổi tên thành “johnSanFrancisco”, còn server 2 đổi tên thành “johnNewYork”, như minh họa trong hình 6-8. Hai thay đổi này được thực hiện đồng thời. Lúc này, ta có các value xung đột, được gọi là version v1 và v2.

![](../images/chapter6/figure6-8.jpg)

Trong ví dụ này, có thể bỏ qua giá trị ban đầu vì các thay đổi được thực hiện dựa trên giá trị đó. Tuy nhiên, không có cách rõ ràng nào để giải quyết xung đột giữa hai version cuối cùng. Để giải quyết vấn đề này, ta cần một hệ thống quản lý version có thể phát hiện và hòa giải xung đột.

**Vector clock** là một kỹ thuật phổ biến để giải quyết vấn đề này.

Hãy xem vector clock hoạt động như thế nào.

Vector clock là một cặp key-value \[server, version] gắn với một data item. Nó được dùng để kiểm tra xem một version có xảy ra trước, kế thừa hoặc xung đột với version khác hay không.

Giả sử một vector clock được biểu diễn bằng D(\[S1, v1], \[S2, v2], ..., \[Sn, vn]), trong đó D là data item, v1 là bộ đếm version, s1 là số server, v.v. Nếu data item D được ghi vào server Si, hệ thống phải thực hiện một trong các tác vụ sau:

* Nếu \[Si, vi] tồn tại, tăng vi.
* Nếu không, tạo một entry mới \[Si, 1].

Logic trừu tượng trên được giải thích bằng một ví dụ cụ thể trong hình 6-9:

![](../images/chapter6/figure6-9.jpg)

1. Client ghi data item D1 vào hệ thống. Thao tác ghi được server Sx xử lý, và server lúc này có vector clock D1\[(Sx, 1)].
2. Một client khác đọc D1 mới nhất, cập nhật nó thành D2 rồi ghi lại. D2 kế thừa từ D1 nên nó ghi đè D1. Giả sử thao tác ghi được cùng server Sx xử lý, server lúc này có vector clock D2(\[Sx, 2]).
3. Một client khác đọc D2 mới nhất, cập nhật nó thành D3 rồi ghi lại. Giả sử thao tác ghi được server Sy xử lý, server lúc này có D3(\[Sx, 2], \[Sy, 1])).
4. Một client khác đọc D2 mới nhất, cập nhật nó thành D4 rồi ghi lại. Giả sử thao tác ghi được server Sz xử lý, server lúc này có D4(\[Sx, 2], \[Sz, 1])).
5. Khi một client khác đọc D3 và D4, nó phát hiện xung đột. Nguyên nhân là data item D2 đã được Sy và Sz sửa đổi đồng thời. Client giải quyết xung đột rồi gửi dữ liệu đã cập nhật đến server. Giả sử thao tác ghi được Sx xử lý, server lúc này có D5(\[Sx, 3], \[Sy, 1], \[Sz, 1]). Chúng ta sẽ sớm giải thích cách phát hiện xung đột.

Với vector clock, ta dễ dàng xác định version X là ancestor của version Y (tức là không xung đột) nếu bộ đếm version của mọi participant trong vector clock của Y đều lớn hơn hoặc bằng bộ đếm version tương ứng trong version X. Ví dụ, vector clock D(\[s0, 1], \[s1, 1])] là ancestor của D(\[s0, 1], \[s1, 2]). Do đó, không có xung đột nào được ghi nhận.

Tương tự, có thể xác định version X là sibling của Y (tức là có xung đột) nếu trong vector clock của Y, bộ đếm của bất kỳ participant nào nhỏ hơn bộ đếm tương ứng của nó trong X. Ví dụ, hai vector clock sau biểu thị một xung đột: D(\[s0, 1], \[s1,2]) và D(\[s0, 2], \[s1, 1])

Mặc dù vector clock có thể giải quyết xung đột, nó cũng có hai nhược điểm rõ ràng. Thứ nhất, vector clock làm client phức tạp hơn vì client phải triển khai logic giải quyết xung đột.

Thứ hai, các cặp \[server: version] trong vector clock có thể tăng nhanh. Để giải quyết vấn đề này, ta đặt một ngưỡng cho độ dài; nếu vượt quá giới hạn, các cặp cũ nhất sẽ bị xóa. Điều này có thể khiến việc xác định quan hệ kế thừa kém hiệu quả vì không thể xác định chính xác quan hệ descendant. Tuy nhiên, theo bài báo Dynamo \[4], Amazon chưa gặp vấn đề này trong môi trường production; do đó, đây có thể là một giải pháp chấp nhận được với hầu hết công ty.

### Xử lý lỗi

Giống như mọi hệ thống quy mô lớn, lỗi không chỉ không thể tránh khỏi mà còn thường xuyên xảy ra. Việc xử lý các tình huống lỗi là rất quan trọng. Trong phần này, trước hết chúng ta giới thiệu các kỹ thuật phát hiện lỗi. Sau đó, chúng ta sẽ giới thiệu các chiến lược xử lý lỗi phổ biến.

*   Phát hiện lỗi

    Trong hệ thống phân tán, không thể chỉ dựa vào lời khẳng định của một server khác để cho rằng một server đã ngừng hoạt động. Thông thường, cần ít nhất hai nguồn thông tin độc lập để đánh dấu một server là đã ngừng hoạt động.

    Như minh họa trong hình 6-10, multicast all-to-all là một giải pháp trực tiếp. Tuy nhiên, cách này không hiệu quả khi hệ thống có nhiều server.

    ![](../images/chapter6/figure6-10.jpg)

    Một giải pháp tốt hơn là sử dụng phương pháp phát hiện lỗi phi tập trung, chẳng hạn như protocol `gossip`. Protocol `gossip` hoạt động như sau:

    * Mỗi node duy trì một danh sách membership của các node, bao gồm member ID và bộ đếm heartbeat.
    * Mỗi node định kỳ tăng bộ đếm heartbeat của nó.
    * Mỗi node định kỳ gửi heartbeat đến một nhóm node ngẫu nhiên, sau đó heartbeat được truyền tiếp đến một nhóm node khác.
    * Khi một node nhận được heartbeat, danh sách membership được cập nhật với thông tin mới nhất.
    * Nếu heartbeat không tăng trong khoảng thời gian định trước, member đó được xem là offline.

    ![](../images/chapter6/figure6-11.jpg)

    Như minh họa trong hình 6-11:

    * Node s0 duy trì một danh sách membership, như ở bên trái.
    * Node s0 nhận thấy bộ đếm heartbeat của node s2 (member ID=2) đã không tăng trong một thời gian dài.
    * Node s0 gửi heartbeat chứa thông tin về s2 đến một nhóm node ngẫu nhiên. Khi các node khác xác nhận bộ đếm heartbeat của s2 đã không được cập nhật trong thời gian dài, node s2 sẽ được đánh dấu; thông tin này sẽ được truyền đến các node khác.
*   Xử lý lỗi tạm thời

    Sau khi lỗi được phát hiện thông qua protocol `gossip`, hệ thống cần triển khai một cơ chế để đảm bảo tính khả dụng. Với phương pháp quorum nghiêm ngặt (`quorum`), các thao tác đọc và ghi có thể bị chặn, như đã trình bày trong phần quorum consensus.

    Một kỹ thuật có tên là “sloppy quorum” \[4] được dùng để cải thiện tính khả dụng. Hệ thống không bắt buộc phải đáp ứng quorum mà chọn W server khỏe mạnh đầu tiên để ghi và R server khỏe mạnh đầu tiên để đọc trên hash ring. Các server offline sẽ bị bỏ qua.

    Nếu server không khả dụng do lỗi mạng hoặc server, một server khác sẽ tạm thời xử lý request. Khi server bị lỗi khởi động lại, các thay đổi sẽ được đẩy trả về để đạt tính nhất quán dữ liệu. Quá trình này được gọi là **hinted handoff**. Vì s2 không khả dụng trong hình 6-12, thao tác đọc và ghi tạm thời được chuyển cho s3 xử lý. Khi s2 hoạt động trở lại, s3 sẽ chuyển dữ liệu trả về cho s2.

    ![](../images/chapter6/figure6-12.jpg)
*   Xử lý lỗi vĩnh viễn

    Hinted handoff được dùng để xử lý lỗi tạm thời. Nếu một replica vĩnh viễn không khả dụng thì sao?

    Để xử lý tình huống này, ta triển khai **anti-entropy protocol** nhằm giữ các replica đồng bộ. Anti-entropy yêu cầu so sánh từng data item trên các replica và cập nhật mỗi replica lên version mới nhất.

    Merkle tree được dùng để phát hiện tình trạng không nhất quán và giảm thiểu lượng dữ liệu cần truyền.

    Trích từ Wikipedia \[7]: “Hash tree hay Merkle tree là một tree trong đó mỗi non-leaf node được gắn nhãn bằng hash của các nhãn hoặc value của các child node (nếu là leaf). Hash tree cho phép xác minh nội dung của các cấu trúc dữ liệu lớn một cách hiệu quả và an toàn”.

    Giả sử key space chạy từ 1 đến 12, các bước dưới đây minh họa cách xây dựng Merkle tree; các ô được tô sáng biểu thị tình trạng không nhất quán.

    * Bước 1: Chia key space thành các bucket (trong ví dụ này là 4 bucket), như minh họa trong hình 6-13. Một bucket được dùng làm node ở level root để giữ cho độ sâu của tree hữu hạn.

    ![](../images/chapter6/figure6-13.jpg)

    * Bước 2: Sau khi tạo các bucket, dùng cùng một phương pháp hash để hash từng key trong bucket (hình 6-14).

    ![](../images/chapter6/figure6-14.jpg)

    * Bước 3: Tạo một hash node cho mỗi bucket (hình 6-15).

    ![](../images/chapter6/figure6-15.jpg)

    * Bước 4: Xây dựng tree từ dưới lên đến root bằng cách tính hash của các node con (hình 6-16).

    ![](../images/chapter6/figure6-16.jpg)

    Để so sánh hai Merkle tree, trước tiên hãy so sánh root hash. Nếu root hash khớp nhau, hai server có cùng dữ liệu. Nếu root hash không khớp, hãy so sánh child hash bên trái, sau đó đến child hash bên phải. Ta có thể duyệt tree để tìm những bucket chưa được đồng bộ và chỉ đồng bộ các bucket đó.

    Khi sử dụng Merkle tree, lượng dữ liệu cần đồng bộ tỷ lệ thuận với sự khác biệt giữa hai replica, chứ không phải với lượng dữ liệu mà chúng chứa. Trong hệ thống thực tế, kích thước bucket khá lớn. Ví dụ, một cấu hình có thể là 1 triệu bucket cho mỗi 1 tỷ key, nên mỗi bucket chỉ chứa 1000 key.
*   Xử lý lỗi gián đoạn data center

    Việc data center bị gián đoạn có thể do mất điện, gián đoạn mạng, thiên tai và các nguyên nhân khác. Để xây dựng một hệ thống có thể xử lý tình trạng data center bị gián đoạn, việc **nhân bản dữ liệu** giữa nhiều data center là cực kỳ quan trọng. Ngay cả khi một data center hoàn toàn offline, người dùng vẫn có thể truy cập dữ liệu thông qua các data center khác.

### Sơ đồ kiến trúc hệ thống

Giờ đây, sau khi đã thảo luận các cân nhắc kỹ thuật khác nhau khi thiết kế kho key-value, chúng ta có thể chuyển sự chú ý sang sơ đồ kiến trúc, như minh họa trong hình 6-17.

![](../images/chapter6/figure6-17.jpg)

Các đặc điểm chính của kiến trúc được liệt kê dưới đây:

* Client giao tiếp với kho key-value thông qua API đơn giản: `get(key)` và `put(key, value)`.
* Coordinator là một node đóng vai trò proxy giữa client và kho key-value.
* Các node được phân phối trên một ring bằng consistent hashing.
* Hệ thống hoàn toàn phi tập trung, nên việc thêm và di chuyển node có thể được thực hiện tự động.
* Dữ liệu được nhân bản trên nhiều node.
* Không có single point of failure vì mọi node đều có cùng trách nhiệm.

Vì thiết kế mang tính phi tập trung, mỗi node thực hiện nhiều tác vụ, như minh họa trong hình 6-18.

![](../images/chapter6/figure6-18.jpg)

### Write path

Hình 6-19 giải thích điều gì xảy ra sau khi write request được định tuyến đến một node cụ thể. Lưu ý rằng thiết kế write/read path được đề xuất chủ yếu dựa trên kiến trúc Cassandra \[8].

1. Write request được lưu bền vững trong commit log file.
2. Dữ liệu được lưu trong memory cache.
   ![](../images/chapter6/figure6-19.jpg)
3. Khi memory cache đầy hoặc đạt đến ngưỡng định trước, dữ liệu được flush xuống SSTable \[9] trên disk. Lưu ý: sorted string table (SSTable) là một danh sách đã sắp xếp gồm các cặp <key, value>. Nếu muốn tìm hiểu thêm về SStable, hãy xem tài liệu tham khảo \[9].

### Read path

Sau khi read request được định tuyến đến một node cụ thể, trước tiên node kiểm tra xem dữ liệu có nằm trong memory cache hay không. Nếu có, dữ liệu được trả về cho client, như minh họa trong hình 6-20.

![](../images/chapter6/figure6-20.jpg)

Nếu dữ liệu không nằm trong memory, nó sẽ được lấy từ disk. Ta cần một phương pháp hiệu quả để xác định SSTable nào chứa key đó. **Bloom filter**\[10] thường được dùng để giải quyết vấn đề này.

Khi dữ liệu không nằm trong memory, read path được thực hiện như trong hình 6-21.

![](../images/chapter6/figure6-21.jpg)

1. Trước tiên, hệ thống kiểm tra xem dữ liệu có nằm trong memory hay không. Nếu không, chuyển sang bước 2.
2. Nếu dữ liệu không nằm trong memory, hệ thống kiểm tra Bloom filter.
3. Bloom filter được dùng để tính toán những SSTable nào có thể chứa key.
4. SSTable trả về kết quả của data set.
5. Kết quả của data set được trả về cho client.

### Tóm tắt

Chương này đề cập đến nhiều khái niệm và kỹ thuật. Để củng cố kiến thức, bảng dưới đây tóm tắt các đặc điểm của kho key-value phân tán và kỹ thuật tương ứng.

| Mục tiêu/Vấn đề              | Kỹ thuật                                       |
| ------------------ | ---------------------------------------- |
| Khả năng lưu trữ dữ liệu lớn           | Phân tán tải trên nhiều server bằng consistent hashing                      |
| Đọc có tính khả dụng cao             | Nhân bản dữ liệu, thiết lập nhiều data center                             |
| Ghi có tính khả dụng cao             | Quản lý version và giải quyết xung đột bằng vector clock (vector clocks)         |
| Phân vùng dữ liệu               | Consistent hashing                                    |
| Khả năng scale tăng dần             | Consistent hashing                                    |
| Tính không đồng nhất (heterogeneity) | Consistent hashing                                    |
| Xử lý lỗi tạm thời            | Sloppy quorum và hinted handoff |
| Xử lý lỗi vĩnh viễn            | Merkle tree                                 |
| Xử lý gián đoạn data center           | Nhân bản giữa các data center                                  |

### Tài liệu tham khảo

* \[1] Amazon DynamoDB: [https://aws.amazon.com/dynamodb/](https://aws.amazon.com/dynamodb/)
* \[2] memcached: [https://memcached.org/](https://memcached.org/)
* \[3] Redis: [https://redis.io/](https://redis.io/)
* \[4] Dynamo: Amazon’s Highly Available Key-value Store: [https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
* \[5] Cassandra: [https://cassandra.apache.org/](https://cassandra.apache.org/)
* \[6] Bigtable: A Distributed Storage System for Structured Data: [https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-](https://static.googleusercontent.com/media/research.google.com/en/archive/bigtable-) osdi06.pdf
* \[7] Merkle tree: [https://en.wikipedia.org/wiki/Merkle\_tree](https://en.wikipedia.org/wiki/Merkle\_tree)
* \[8] Cassandra architecture: [https://cassandra.apache.org/doc/latest/architecture/](https://cassandra.apache.org/doc/latest/architecture/)
* \[9] SStable: [https://www.igvita.com/2012/02/06/sstable-and-log-structured-storage-leveldb/](https://www.igvita.com/2012/02/06/sstable-and-log-structured-storage-leveldb/)
* \[10] Bloom filter [https://en.wikipedia.org/wiki/Bloom\_filter](https://en.wikipedia.org/wiki/Bloom\_filter)
