# Tổng hợp sự kiện click quảng cáo

Khi Facebook, YouTube, TikTok và nền kinh tế truyền thông trực tuyến phát triển mạnh, quảng cáo kỹ thuật số chiếm tỷ trọng ngày càng lớn trong tổng chi tiêu quảng cáo. Vì vậy, việc theo dõi các sự kiện click quảng cáo trở nên rất quan trọng. Trong chương này, chúng ta sẽ tìm hiểu cách thiết kế một hệ thống tổng hợp sự kiện click quảng cáo ở quy mô Facebook hoặc Google.

Trước khi đi sâu vào thiết kế kỹ thuật, hãy cùng tìm hiểu các khái niệm cốt lõi của quảng cáo trực tuyến để hiểu rõ hơn về chủ đề này. Một ưu điểm cốt lõi của quảng cáo trực tuyến là khả năng đo lường, được định lượng bằng dữ liệu theo thời gian thực.

Quảng cáo kỹ thuật số có một quy trình cốt lõi gọi là đấu giá thời gian thực (Real-Time Bidding, RTB), trong đó inventory quảng cáo được mua bán. Hình 1 cho thấy quảng cáo trực tuyến hoạt động như thế nào.

![](../images/v2/chapter06/figure6-1.png)

Tốc độ của quy trình RTB rất quan trọng vì nó thường hoàn tất trong chưa đầy một giây.

Độ chính xác của dữ liệu cũng rất quan trọng. Việc tổng hợp sự kiện click quảng cáo đóng vai trò then chốt trong việc đo lường hiệu quả của quảng cáo trực tuyến, điều này ảnh hưởng trực tiếp đến số tiền nhà quảng cáo phải trả. Dựa trên kết quả tổng hợp click, người quản lý chiến dịch có thể kiểm soát ngân sách hoặc điều chỉnh chiến lược bidding, chẳng hạn như thay đổi nhóm đối tượng mục tiêu, từ khóa, v.v. Các chỉ số quan trọng được sử dụng trong quảng cáo trực tuyến, bao gồm tỷ lệ click (CTR, click-through rate)[^1] và tỷ lệ chuyển đổi (CVR, conversion rate)[^2], đều phụ thuộc vào dữ liệu click quảng cáo đã tổng hợp.

## Bước 1 - Hiểu vấn đề và xác định phạm vi thiết kế

Các câu hỏi sau giúp làm rõ yêu cầu và thu hẹp phạm vi.

Ứng viên: Dữ liệu đầu vào có định dạng gì?

Người phỏng vấn: Đây là các file log nằm trên những server khác nhau, trong đó các sự kiện click mới nhất được append vào cuối file log. Sự kiện có các thuộc tính sau: `ad_id`, `click_timestamp`, `user_id`, `ip` và `country`.

Ứng viên: Khối lượng dữ liệu là bao nhiêu?

Người phỏng vấn: 1 tỷ lượt click quảng cáo mỗi ngày, tổng cộng có 2 triệu quảng cáo. Số lượng sự kiện click quảng cáo tăng 30% mỗi năm.

Ứng viên: Những query quan trọng nhất cần hỗ trợ là gì?

Người phỏng vấn: Hệ thống cần hỗ trợ 3 query sau:

- Trả về số lượng sự kiện click của một quảng cáo cụ thể trong $M$ phút vừa qua.
- Trả về 100 quảng cáo có số lượt click cao nhất trong 1 phút vừa qua. Cả hai tham số đều phải có thể cấu hình. Việc tổng hợp diễn ra mỗi phút một lần.
- Hỗ trợ lọc dữ liệu của hai query trên bằng `ip`, `user_id` hoặc `country`.

Ứng viên: Chúng ta có cần lo lắng về các trường hợp biên không? Tôi nghĩ đến những điểm sau:

- Có thể có các sự kiện đến muộn hơn dự kiến.
- Có thể có các sự kiện trùng lặp.
- Những phần khác nhau của hệ thống có thể gặp sự cố bất cứ lúc nào, vì vậy chúng ta cần tính đến việc khôi phục hệ thống.

Người phỏng vấn: Danh sách này rất tốt. Đúng vậy, hãy tính đến các yếu tố này.

Ứng viên: Yêu cầu về độ trễ là gì?

Người phỏng vấn: Độ trễ end-to-end ở mức vài phút. Lưu ý rằng yêu cầu độ trễ của RTB và việc tổng hợp click quảng cáo rất khác nhau. Do yêu cầu về thời gian phản hồi, độ trễ của RTB thường dưới một giây, trong khi việc tổng hợp sự kiện click quảng cáo có thể chấp nhận độ trễ vài phút vì nó chủ yếu được dùng cho việc tính phí và báo cáo quảng cáo.

Từ những thông tin thu thập được ở trên, chúng ta có các yêu cầu chức năng và phi chức năng.

### Yêu cầu chức năng

- Tổng hợp số lượt click của `ad_id` trong $M$ phút vừa qua.
- Trả về 100 `ad_id` có số lượt click cao nhất mỗi phút.
- Hỗ trợ tổng hợp và lọc theo các thuộc tính khác nhau.
- Quy mô dataset đạt mức của Facebook hoặc Google (xem phần ước tính sơ bộ bên dưới để biết chi tiết về yêu cầu quy mô hệ thống).

### Yêu cầu phi chức năng

- Tính đúng đắn của kết quả tổng hợp rất quan trọng vì dữ liệu được dùng cho RTB và tính phí quảng cáo.
- Xử lý đúng các sự kiện đến muộn hoặc bị trùng lặp.
- Tính robust. Hệ thống phải có khả năng chống chịu khi một phần hệ thống gặp sự cố.
- Yêu cầu về độ trễ. Độ trễ end-to-end tối đa nên ở mức vài phút.

### Ước tính sơ bộ

Hãy thực hiện một số ước tính để hiểu quy mô hệ thống và những thách thức tiềm ẩn cần giải quyết.

- 1 tỷ DAU (daily active user).
- Giả sử mỗi người dùng click trung bình 1 quảng cáo. Như vậy là 1 tỷ sự kiện click quảng cáo mỗi ngày.
- QPS click quảng cáo $= \frac{10^9 \ \mathrm{events}}{10^5 \ \mathrm{seconds\ in\ a\ day}} = 10,000$
- Giả sử QPS click quảng cáo lúc cao điểm gấp 5 lần mức trung bình. QPS cao điểm = 50,000 QPS.
- Giả sử một sự kiện click quảng cáo chiếm 0.1 KB lưu trữ. Nhu cầu lưu trữ mỗi ngày là: $`0.1\,\mathrm{KB} \times 1\ billion = 100\,\mathrm{GB}`$. Nhu cầu lưu trữ mỗi tháng khoảng 3 TB.

## Bước 2 - Đề xuất thiết kế cấp cao và nhận phê duyệt

Trong phần này, chúng ta sẽ thảo luận về thiết kế query API, data model và thiết kế cấp cao.

### Thiết kế query API

Mục đích của thiết kế API là đạt được sự thống nhất giữa client và server. Trong các ứng dụng dành cho người dùng, client thường là người dùng cuối sử dụng sản phẩm. Tuy nhiên, trong trường hợp này, client là người dùng dashboard (data scientist, product manager, nhà quảng cáo, v.v.), những người chạy query trên service tổng hợp.

Hãy xem lại các yêu cầu chức năng để thiết kế API tốt hơn:

- Tổng hợp số lượt click của `ad_id` trong $M$ phút vừa qua.
- Trả về $N$ quảng cáo có số lượt click cao nhất trong $M$ phút vừa qua.
- Hỗ trợ tổng hợp và lọc theo các thuộc tính khác nhau.

Chúng ta chỉ cần 2 API để hỗ trợ 3 use case này, vì việc lọc (yêu cầu cuối cùng) có thể được hỗ trợ bằng cách thêm query parameter vào request.

**API 1: Tổng hợp số lượt click của `ad_id` trong M phút vừa qua.**

![](../images/v2/chapter06/table6-1.png)

Các tham số request là:

![](../images/v2/chapter06/table6-2.png)

Response:

![](../images/v2/chapter06/table6-3.png)

**API 2: Trả về $N$ `ad_id` có số lượt click cao nhất trong $M$ phút vừa qua**

![](../images/v2/chapter06/table6-4.png)

Các tham số request là:

![](../images/v2/chapter06/table6-5.png)

Response:

![](../images/v2/chapter06/table6-6.png)

### Data model

Hệ thống có hai loại dữ liệu: dữ liệu raw và dữ liệu tổng hợp.

#### Dữ liệu raw

Dưới đây là hình thức của dữ liệu raw trong file log:

```
[AdClickEvent] ad001, 2021-01-01 00:00:01, user 1, 207.148.22.22, USA
```

Bảng 7 liệt kê các field dữ liệu dưới dạng có cấu trúc. Dữ liệu được phân tán trên các application server khác nhau.

![](../images/v2/chapter06/table6-7.png)

#### Dữ liệu tổng hợp

Giả sử các sự kiện click quảng cáo được tổng hợp mỗi phút một lần. Bảng 8 cho thấy kết quả tổng hợp.

![](../images/v2/chapter06/table6-8.png)

Để hỗ trợ lọc quảng cáo, chúng ta thêm một field `filter_id` vào bảng. Các record có cùng `ad_id` và `click_minute` được group theo `filter_id`, như trong Bảng 9; các filter được định nghĩa trong Bảng 10.

![](../images/v2/chapter06/table6-9.png)

![](../images/v2/chapter06/table6-10.png)

Để hỗ trợ query trả về $N$ quảng cáo có số lượt click cao nhất trong $M$ phút vừa qua, cấu trúc sau được sử dụng.

![](../images/v2/chapter06/table6-11.png)

#### So sánh

So sánh việc lưu trữ dữ liệu raw và dữ liệu tổng hợp được trình bày dưới đây:

![](../images/v2/chapter06/table6-12.png)

Chúng ta nên lưu dữ liệu raw hay dữ liệu tổng hợp? Khuyến nghị của chúng tôi là lưu cả hai. Hãy xem lý do.

- Giữ lại dữ liệu raw là một ý tưởng tốt. Nếu có vấn đề xảy ra, chúng ta có thể dùng dữ liệu raw để debug. Nếu dữ liệu tổng hợp bị hỏng do bug, chúng ta có thể tính toán lại dữ liệu tổng hợp từ dữ liệu raw sau khi sửa bug.
- Dữ liệu tổng hợp cũng nên được lưu trữ. Kích thước dữ liệu raw là rất lớn. Kích thước lớn khiến việc query trực tiếp dữ liệu raw trở nên kém hiệu quả. Để giải quyết vấn đề này, chúng ta chạy các read query trên dữ liệu tổng hợp.
- Dữ liệu raw đóng vai trò dữ liệu backup. Thông thường chúng ta không cần query dữ liệu raw, trừ khi cần tính toán lại. Dữ liệu raw cũ có thể được chuyển sang cold storage để giảm chi phí.
- Dữ liệu tổng hợp đóng vai trò dữ liệu active. Dữ liệu này được điều chỉnh để cải thiện query performance.

#### Chọn database phù hợp

Khi chọn database phù hợp, chúng ta cần đánh giá những điểm sau:

- Dữ liệu có dạng gì? Dữ liệu có quan hệ không? Đó là document hay binary large object?
- Workflow thiên về đọc, thiên về ghi hay cả hai?
- Có cần hỗ trợ transaction không?
- Query có phụ thuộc vào nhiều hàm xử lý phân tích trực tuyến (OLAP)[^3] như SUM, COUNT không?

Trước tiên hãy kiểm tra dữ liệu raw. Mặc dù trong hoạt động bình thường chúng ta không cần query dữ liệu raw, dữ liệu này hữu ích cho data scientist hoặc machine learning engineer khi nghiên cứu dự đoán phản hồi của người dùng, behavioral targeting, feedback liên quan, v.v.[^4]

Như phần ước tính sơ bộ đã chỉ ra, QPS ghi trung bình là 10,000 và QPS cao điểm có thể đạt 50,000, vì vậy hệ thống thiên về ghi. Về đọc, dữ liệu raw được dùng làm backup và nguồn để tính toán lại, nên về lý thuyết lưu lượng đọc rất nhỏ.

Database quan hệ có thể thực hiện công việc này, nhưng việc scale write có thể khá thách thức. Các database NoSQL như Cassandra và InfluxDB phù hợp hơn vì chúng được tối ưu cho việc ghi và query theo time range.

Một lựa chọn khác là lưu dữ liệu trong Amazon S3, sử dụng một trong các định dạng dữ liệu dạng cột như ORC[^5], Parquet[^6] hoặc AVRO[^7]. Chúng ta có thể đặt giới hạn kích thước cho mỗi file (ví dụ 10GB); stream processor chịu trách nhiệm ghi dữ liệu raw có thể rotate file khi đạt đến giới hạn kích thước. Vì thiết lập này có thể còn xa lạ với nhiều người, trong thiết kế này chúng ta lấy Cassandra làm ví dụ.

Đối với dữ liệu tổng hợp, bản chất của dữ liệu là time series và workflow cũng thiên về cả đọc lẫn ghi. Đó là vì với mỗi quảng cáo, chúng ta cần query database mỗi phút để hiển thị cho khách hàng số liệu tổng hợp mới nhất. Tính năng này hữu ích cho việc tự động refresh dashboard hoặc trigger alert kịp thời. Vì tổng cộng có 2 triệu quảng cáo nên workflow thiên về đọc. Dữ liệu được aggregation service tổng hợp và ghi mỗi phút, do đó workflow cũng thiên về ghi. Chúng ta có thể sử dụng cùng một loại database để lưu dữ liệu raw và dữ liệu tổng hợp.

Bây giờ chúng ta đã thảo luận về thiết kế query API và data model, hãy ghép thiết kế cấp cao lại với nhau.

### Thiết kế cấp cao

Trong xử lý big data thời gian thực[^8], dữ liệu thường đi vào và đi ra khỏi hệ thống xử lý dưới dạng unbounded data stream. Service tổng hợp cũng hoạt động như vậy; đầu vào là dữ liệu raw (unbounded data stream), đầu ra là kết quả tổng hợp (xem Hình 2).

![](../images/v2/chapter06/figure6-2.png)

#### Xử lý bất đồng bộ

Thiết kế hiện tại của chúng ta là đồng bộ. Điều này không tốt vì capacity của producer và consumer không phải lúc nào cũng bằng nhau. Hãy xem xét tình huống sau: nếu traffic đột ngột tăng, số lượng sự kiện được tạo ra vượt xa khả năng xử lý của consumer, consumer có thể gặp lỗi out-of-memory hoặc bị shutdown ngoài ý muốn. Nếu một component trong chuỗi đồng bộ gặp sự cố, toàn bộ hệ thống sẽ ngừng hoạt động.

Một giải pháp phổ biến là sử dụng message queue (Kafka) để decouple producer và consumer. Điều này biến toàn bộ quy trình thành bất đồng bộ, producer/consumer có thể scale độc lập.

Kết hợp tất cả những gì đã thảo luận, chúng ta có thiết kế cấp cao như trong Hình 3. Log monitor, aggregation service và database được decouple bằng hai message queue. Database writer poll dữ liệu từ message queue, chuyển dữ liệu sang format của database rồi ghi vào database.

![](../images/v2/chapter06/figure6-3.png)

Message queue thứ nhất lưu trữ gì? Nó chứa dữ liệu sự kiện click quảng cáo, như trong Bảng 13.

![](../images/v2/chapter06/table6-13.png)

Message queue thứ hai lưu trữ gì? Message queue thứ hai chứa hai loại dữ liệu:

1. Số lượt click quảng cáo được tổng hợp theo từng phút.

![](../images/v2/chapter06/table6-14.png)

2. Các quảng cáo có số lượt click cao nhất $N$, được tổng hợp theo từng phút.

![](../images/v2/chapter06/table6-15.png)

Có thể bạn sẽ thắc mắc tại sao chúng ta không ghi trực tiếp kết quả tổng hợp vào database. Câu trả lời ngắn gọn là chúng ta cần message queue thứ hai như Kafka để triển khai exactly-once semantic end-to-end (atomic commit)[^9].

![](../images/v2/chapter06/figure6-4.png)

Tiếp theo, hãy đi sâu vào chi tiết của aggregation service.

#### Aggregation service

Framework MapReduce là một lựa chọn tốt để tổng hợp các sự kiện click quảng cáo. Mô hình directed acyclic graph (DAG)[^10] của nó rất phù hợp. Điểm cốt lõi của mô hình DAG là chia hệ thống thành các unit tính toán nhỏ, như các node Map/Aggregate/Reduce trong Hình 5.

![](../images/v2/chapter06/figure6-5.png)

Mỗi node chịu trách nhiệm cho một task duy nhất và gửi kết quả xử lý đến node downstream.

**Node Map**

Node Map đọc dữ liệu từ data source, sau đó filter và transform dữ liệu. Ví dụ, node Map gửi các quảng cáo có `ad_id % 2 = 0` đến node 1, các quảng cáo còn lại đến node 2, như trong Hình 6.

![](../images/v2/chapter06/figure6-6.png)

Có thể bạn sẽ thắc mắc tại sao chúng ta cần node Map. Một phương án thay thế là thiết lập Kafka partition hoặc tag để các node aggregation subscribe trực tiếp vào Kafka. Điều này khả thi, nhưng dữ liệu đầu vào có thể cần được làm sạch hoặc normalize, và các thao tác này có thể do node Map thực hiện. Một lý do khác là chúng ta có thể không kiểm soát được cách dữ liệu được tạo ra, vì vậy các sự kiện có cùng `ad_id` có thể rơi vào các Kafka partition khác nhau.

**Node Aggregate**

Node aggregation đếm các sự kiện click quảng cáo trong memory theo `ad_id` mỗi phút. Trong paradigm MapReduce, node aggregation là một phần của Reduce. Vì vậy, quy trình map-aggregate-reduce thực tế là map-reduce-reduce.

**Node Reduce**

Node Reduce rút gọn kết quả tổng hợp từ tất cả các node “Aggregate” thành kết quả cuối cùng. Ví dụ, như trong Hình 7, có ba node aggregation, mỗi node chứa 3 quảng cáo có số lượt click cao nhất trong node đó. Node Reduce rút gọn tổng số quảng cáo có số lượt click cao nhất xuống còn 3.

![](../images/v2/chapter06/figure6-7.png)

Mô hình DAG đại diện cho paradigm MapReduce phổ biến. Nó được thiết kế để xử lý big data và dùng tính toán phân tán song song để chuyển big data thành dữ liệu có kích thước nhỏ hoặc thông thường.

Trong mô hình DAG, dữ liệu trung gian có thể được lưu trong memory; các node khác nhau có thể giao tiếp với nhau qua TCP (các node chạy trong các process khác nhau) hoặc shared memory (các node chạy trong các thread khác nhau).

##### Use case chính

Bây giờ chúng ta đã hiểu cách MapReduce hoạt động ở cấp cao, hãy xem nó được tận dụng như thế nào để hỗ trợ các use case chính:

- Tổng hợp số lượt click quảng cáo trong $M$ phút vừa qua.
- Trả về $N$ quảng cáo có số lượt click cao nhất trong $M$ phút vừa qua.
- Lọc dữ liệu.

**Use case 1: Tổng hợp số lượt click**

Như trong Hình 8, các sự kiện đầu vào được partition trong các node Map theo `ad_id` (`ad_id % 3`), sau đó được aggregate trong các node aggregation.

![](../images/v2/chapter06/figure6-8.png)

**Use case 2: Trả về các quảng cáo có số lượt click cao nhất**

Hình 9 cho thấy thiết kế đơn giản hóa để lấy 3 quảng cáo có số lượt click cao nhất; thiết kế này có thể mở rộng cho top $N$. Các sự kiện đầu vào được map bằng `ad_id`; mỗi Aggregate Node duy trì một heap data structure để lấy 3 quảng cáo đứng đầu trong node một cách hiệu quả. Ở bước cuối, node Reduce rút gọn 9 quảng cáo (3 quảng cáo đứng đầu từ mỗi node aggregation) thành 3 quảng cáo có số lượt click mỗi phút cao nhất.

![](../images/v2/chapter06/figure6-9.png)

**Use case 3: Lọc dữ liệu**

Để hỗ trợ lọc dữ liệu, chẳng hạn “chỉ hiển thị số lượt click tổng hợp của ad001 ở Mỹ”, chúng ta có thể định nghĩa trước các tiêu chí lọc và tổng hợp dựa trên các tiêu chí đó. Ví dụ, kết quả tổng hợp của `ad001` và `ad002` như sau:

![](../images/v2/chapter06/table6-16.png)

Kỹ thuật này được gọi là star schema[^11] và được sử dụng rộng rãi trong data warehouse. Các field lọc được gọi là dimension. Phương pháp này có các ưu điểm sau:

- Dễ hiểu và dễ xây dựng.
- Có thể tái sử dụng aggregation service hiện tại để tạo thêm dimension trong star schema. Không cần component bổ sung.
- Truy cập dữ liệu dựa trên tiêu chí lọc nhanh vì kết quả đã được tính toán trước.

Một hạn chế của phương pháp này là nó tạo ra nhiều bucket và record hơn, đặc biệt khi có nhiều tiêu chí lọc.

## Bước 3 - Đi sâu vào thiết kế

Trong phần này, chúng ta sẽ đi sâu vào các nội dung sau:

- Stream processing và batch processing
- Time và aggregation window
- Delivery guarantee
- Scale hệ thống
- Data monitoring và tính đúng đắn
- Sơ đồ thiết kế cuối cùng
- Fault tolerance

### Stream processing và batch processing

Kiến trúc cấp cao chúng ta đề xuất trong Hình 3 là một hệ thống stream processing. Bảng 17 cho thấy so sánh giữa ba loại hệ thống[^12]:

![](../images/v2/chapter06/table6-17.png)[^13]

Trong thiết kế của chúng ta, stream processing và batch processing được sử dụng đồng thời. Chúng ta tận dụng stream processing để xử lý dữ liệu đến và tạo ra kết quả tổng hợp gần như real-time. Chúng ta tận dụng batch processing để backup dữ liệu lịch sử.

Đối với hệ thống có đồng thời hai processing path (batch processing và stream processing), kiến trúc này được gọi là lambda[^14]. Một nhược điểm của kiến trúc lambda là có hai processing path, nghĩa là cần duy trì hai codebase. Kiến trúc kappa[^15] giải quyết vấn đề này bằng cách kết hợp batch processing và stream processing trong một processing path. Ý tưởng cốt lõi là sử dụng một stream processing engine duy nhất để xử lý dữ liệu real-time và reprocess dữ liệu liên tục. Hình 10 cho thấy sự so sánh giữa kiến trúc lambda và kappa.

![](../images/v2/chapter06/figure6-10.png)

Thiết kế cấp cao của chúng ta sử dụng kiến trúc kappa, trong đó việc reprocess dữ liệu lịch sử cũng đi qua aggregation service real-time. Xem phần “Tính toán lại dữ liệu” để biết chi tiết.

#### Tính toán lại dữ liệu

Đôi khi chúng ta phải tính toán lại dữ liệu tổng hợp, còn gọi là replay dữ liệu lịch sử. Ví dụ, nếu phát hiện một bug nghiêm trọng trong aggregation service, chúng ta cần tính toán lại dữ liệu tổng hợp từ dữ liệu raw, bắt đầu từ thời điểm bug được đưa vào. Hình 11 cho thấy quy trình tính toán lại dữ liệu:

1. Recalculation service lấy dữ liệu từ raw data store. Đây là một batch job.
2. Dữ liệu lấy được được gửi đến aggregation service chuyên dụng để việc xử lý real-time không bị ảnh hưởng bởi replay dữ liệu lịch sử.
3. Kết quả tổng hợp được gửi đến message queue thứ hai, sau đó được cập nhật vào aggregation database.

![](../images/v2/chapter06/figure6-11.png)

Quy trình tính toán lại sử dụng lại aggregation service, nhưng dùng data source khác (dữ liệu raw).

### Time

Chúng ta cần timestamp để thực hiện tổng hợp. Timestamp có thể được tạo ra ở hai nơi khác nhau:

- Event time: thời điểm click quảng cáo xảy ra.
- Processing time: system time của aggregation machine xử lý sự kiện click.

Do network latency và môi trường bất đồng bộ (dữ liệu đi qua message queue), khoảng cách giữa event time và processing time có thể rất lớn. Như trong Hình 12, sự kiện 1 đến aggregation service rất muộn (muộn 5 giờ).

![](../images/v2/chapter06/figure6-12.png)

Nếu dùng event time để tổng hợp, chúng ta phải xử lý các sự kiện đến muộn. Nếu dùng processing time để tổng hợp, kết quả tổng hợp có thể không chính xác. Không có giải pháp hoàn hảo, vì vậy chúng ta cần cân nhắc trade-off.

![](../images/v2/chapter06/table6-18.png)

Vì tính chính xác của dữ liệu rất quan trọng, chúng tôi khuyến nghị sử dụng event time để tổng hợp. Vậy làm thế nào để xử lý đúng các sự kiện đến muộn? Một kỹ thuật gọi là “watermark” thường được dùng để xử lý các sự kiện đến hơi muộn.

Trong Hình 13, các sự kiện click quảng cáo được tổng hợp trong các tumbling window kéo dài một phút (xem phần “Aggregation window” để biết thêm chi tiết). Nếu dùng event time để quyết định sự kiện có nằm trong window hay không, Window 1 sẽ bỏ sót sự kiện 2, Window 3 sẽ bỏ sót sự kiện 5 vì chúng đến sau thời điểm kết thúc của aggregation window tương ứng.

![](../images/v2/chapter06/figure6-13.png)

Một cách giải quyết vấn đề này là sử dụng “watermark” (hình chữ nhật mở rộng trong Hình 14), được xem là phần mở rộng của aggregation window. Cách này cải thiện độ chính xác của kết quả tổng hợp. Bằng cách mở rộng aggregation window thêm 15 giây (có thể điều chỉnh), Window 1 có thể chứa sự kiện 2, Window 3 có thể chứa sự kiện 5.

Giá trị watermark phụ thuộc vào yêu cầu nghiệp vụ. Watermark dài hơn có thể bắt được các sự kiện đến rất muộn, nhưng làm tăng độ trễ của hệ thống. Watermark ngắn hơn có nghĩa là độ chính xác dữ liệu thấp hơn, nhưng giảm độ trễ của hệ thống.

![](../images/v2/chapter06/figure6-14.png)

Lưu ý rằng kỹ thuật watermark không thể xử lý các sự kiện bị trễ trong thời gian dài. Chúng ta có thể cho rằng ROI (Return On Investment) của việc thiết kế một hệ thống phức tạp cho các sự kiện có xác suất thấp là không đáng. Chúng ta có thể sửa một lượng nhỏ dữ liệu không chính xác bằng cách đối soát cuối ngày (xem phần Đối soát). Một trade-off cần cân nhắc là watermark có thể cải thiện độ chính xác dữ liệu nhưng làm tăng độ trễ tổng thể vì cần chờ lâu hơn.

### Aggregation window

Theo cuốn *Designing data-intensive applications* của Martin Kleppmann[^16], có 4 loại window function: tumbling window (còn gọi là fixed window), hopping window, sliding window và session window. Chúng ta sẽ thảo luận về tumbling window và sliding window vì chúng liên quan nhất đến hệ thống của chúng ta.

Trong tumbling window (được highlight trong Hình 15), thời gian được chia thành các đoạn có cùng độ dài và không chồng lấn. Tumbling window rất phù hợp để tổng hợp sự kiện click quảng cáo mỗi phút (use case 1).

![](../images/v2/chapter06/figure6-15.png)

Trong sliding window (được highlight trong Hình 16), các sự kiện được group trong một window trượt qua data stream theo khoảng thời gian được chỉ định. Sliding window có thể chồng lấn. Đây là một chiến lược tốt để đáp ứng use case thứ hai; lấy $N$ quảng cáo có số lượt click cao nhất trong $M$ phút vừa qua.

![](../images/v2/chapter06/figure6-16.png)

### Delivery guarantee

Vì kết quả tổng hợp được dùng cho việc tính phí, độ chính xác và tính đầy đủ của dữ liệu rất quan trọng. Hệ thống cần có khả năng trả lời các câu hỏi sau:

- Làm thế nào để tránh xử lý các sự kiện trùng lặp?
- Làm thế nào để đảm bảo mọi sự kiện đều được xử lý?

Message queue như Kafka thường cung cấp ba delivery semantic: at-most-once, at-least-once và exactly-once.

#### Nên chọn kiểu delivery nào?

Trong hầu hết trường hợp, nếu có thể chấp nhận một lượng nhỏ dữ liệu trùng lặp thì xử lý at-least-once là đủ.

Tuy nhiên, điều này không đúng với hệ thống của chúng ta. Chênh lệch vài phần trăm trong dữ liệu có thể dẫn đến khác biệt hàng triệu đô la. Vì vậy, chúng tôi khuyến nghị sử dụng exactly-once delivery cho hệ thống. Nếu muốn tìm hiểu thêm về một hệ thống tổng hợp quảng cáo thực tế, hãy xem implementation của Yelp[^17].

#### Khử trùng lặp dữ liệu

Một trong những vấn đề phổ biến nhất về chất lượng dữ liệu là dữ liệu trùng lặp. Dữ liệu trùng lặp có thể đến từ nhiều nguồn; trong phần này chúng ta thảo luận về hai nguồn phổ biến.

- Client: ví dụ, client có thể gửi lại cùng một sự kiện nhiều lần. Các sự kiện trùng lặp được gửi với mục đích xấu tốt nhất nên được xử lý bởi component chống gian lận quảng cáo/quản lý rủi ro. Nếu quan tâm đến chủ đề này, hãy tham khảo tài liệu tham khảo[^18].
- Server failure: nếu một node aggregation gặp sự cố giữa chừng trong quá trình tổng hợp và upstream service chưa nhận được acknowledgement, cùng một sự kiện có thể được gửi và tổng hợp lại. Hãy xem xét kỹ hơn.

Hình 17 cho thấy sự cố của node aggregation (Aggregator) có thể đưa dữ liệu trùng lặp vào hệ thống như thế nào. Aggregator quản lý trạng thái tiêu thụ dữ liệu bằng cách lưu offset của upstream Kafka.

![](../images/v2/chapter06/figure6-17.png)

Nếu bước 6 thất bại, có thể do aggregator gặp sự cố, các event 100 đến 110 đã được gửi xuống downstream nhưng offset mới 110 chưa được lưu trong upstream Kafka. Trong trường hợp này, aggregator mới sẽ bắt đầu consume từ offset 100, dù các sự kiện này đã được xử lý, và dẫn đến dữ liệu trùng lặp.

Giải pháp đơn giản nhất (Hình 18) là sử dụng external file storage (chẳng hạn HDFS hoặc S3) để ghi lại offset. Tuy nhiên, giải pháp này cũng có vấn đề.

![](../images/v2/chapter06/figure6-18.png)

Trong bước 3, aggregator sẽ xử lý các event 100 đến 110 với điều kiện offset cuối cùng được lưu trong external storage là 100. Nếu offset được lưu trong storage là 110, aggregator sẽ bỏ qua các event trước offset 110.

Nhưng thiết kế này có một vấn đề lớn: offset được lưu vào HDFS / S3 trước khi kết quả tổng hợp được gửi xuống downstream (bước 3.2). Nếu bước 4 thất bại do aggregator gặp sự cố, các event 100 đến 110 sẽ không bao giờ được node aggregator khởi động mới xử lý vì offset được lưu trong external storage là 110.

Để tránh mất dữ liệu, chúng ta cần lưu offset sau khi nhận acknowledgement từ downstream. Thiết kế được cập nhật như trong Hình 19.

![](../images/v2/chapter06/figure6-19.png)

Trong thiết kế này, nếu aggregator gặp sự cố trước khi thực hiện bước 5.1, các event 100 đến 110 sẽ được gửi xuống downstream một lần nữa. Để triển khai xử lý “exactly-once”, chúng ta cần đặt các thao tác từ bước 4 đến bước 6 trong một distributed transaction. Distributed transaction là transaction chạy trên nhiều node. Nếu bất kỳ thao tác nào thất bại, toàn bộ transaction sẽ rollback.

![](../images/v2/chapter06/figure6-20.png)

Như bạn thấy, việc khử trùng lặp dữ liệu trong các hệ thống quy mô lớn không dễ. Cách triển khai xử lý exactly-once là một chủ đề nâng cao. Nếu quan tâm đến chi tiết, hãy tham khảo tài liệu tham khảo[^9].

### Scale hệ thống

Từ phần ước tính sơ bộ, chúng ta biết nghiệp vụ tăng trưởng 30% mỗi năm, dẫn đến khối lượng tăng gấp đôi trong 3 năm. Làm thế nào để xử lý sự tăng trưởng này? Hãy cùng xem.

Hệ thống của chúng ta gồm ba component độc lập: message queue, aggregation service và database. Vì các component này đã được decouple, chúng ta có thể scale từng component một cách độc lập.

#### Scale message queue

Chúng ta đã thảo luận chi tiết về cách scale message queue trong chương “Distributed message queue”, vì vậy ở đây chỉ nhắc ngắn gọn một vài điểm.

**Producer.** Chúng ta không giới hạn số lượng instance producer, vì vậy khả năng scale của producer có thể dễ dàng đạt được.

**Consumer.** Trong một consumer group, cơ chế rebalance giúp scale consumer bằng cách thêm hoặc xóa node. Như trong Hình 21, bằng cách thêm 2 consumer, mỗi consumer chỉ xử lý event của một partition.

![](../images/v2/chapter06/figure6-21.png)

Khi hệ thống có hàng trăm Kafka consumer, việc consumer rebalance có thể rất chậm, có thể mất vài phút hoặc lâu hơn. Vì vậy, nếu cần thêm consumer, hãy cố gắng thực hiện vào thời gian không cao điểm để giảm thiểu ảnh hưởng.

**Brokers**

- **Hash key**

  Sử dụng `ad_id` làm hash key của Kafka partition để lưu các sự kiện từ cùng một `ad_id` trong cùng một Kafka partition. Trong trường hợp này, aggregation service có thể subscribe từ một partition duy nhất để nhận tất cả sự kiện của cùng một `ad_id`.

- **Số lượng partition**

  Nếu số lượng partition thay đổi, các sự kiện của cùng một `ad_id` có thể được map vào các partition khác nhau. Vì vậy, nên pre-allocate đủ partition từ trước để tránh tăng động số lượng partition trong production.

- **Physical sharding của topic**

  Thông thường một topic là không đủ. Chúng ta có thể tách dữ liệu theo vị trí địa lý (`topic_north_america`, `topic_europe`, `topic_asia`, v.v.) hoặc theo loại nghiệp vụ (`topic_web_ads`, `topic_mobile_ads`, v.v.).

  - **Ưu điểm:** Chia dữ liệu vào các topic khác nhau có thể giúp cải thiện throughput của hệ thống. Với ít consumer hơn cho mỗi topic, thời gian consumer group rebalance cũng giảm.
  - **Nhược điểm:** Cách này tạo thêm độ phức tạp và tăng chi phí bảo trì.

#### Scale aggregation service

Trong thiết kế cấp cao, chúng ta đã nói aggregation service là một thao tác map/reduce. Hình 22 cho thấy tất cả component kết nối với nhau như thế nào.

![](../images/v2/chapter06/figure6-22.png)

Nếu quan tâm đến chi tiết, hãy tham khảo tài liệu tham khảo[^19]. Aggregation service có thể scale ngang bằng cách thêm hoặc xóa node. Có một câu hỏi thú vị: làm thế nào để tăng throughput của aggregation service? Có hai lựa chọn.

Lựa chọn 1: Phân phối các event có ad_ids khác nhau cho các thread khác nhau, như trong Hình 23.

![](../images/v2/chapter06/figure6-23.png)

Lựa chọn 2: Deploy các node aggregation service trên resource provider, chẳng hạn Apache Hadoop YARN[^20]. Bạn có thể xem cách này là tận dụng multi-processing.

Lựa chọn 1 đơn giản hơn để triển khai và không phụ thuộc vào resource provider. Tuy nhiên, trong thực tế, lựa chọn 2 được sử dụng rộng rãi hơn vì chúng ta có thể scale hệ thống bằng cách thêm nhiều resource tính toán.

#### Scale database

Cassandra tự hỗ trợ scale ngang, theo cách tương tự consistent hashing.

![](../images/v2/chapter06/figure6-24.png)

Dữ liệu được phân bổ đều vào mỗi node dựa trên giá trị hash và có replication factor phù hợp. Mỗi node giữ một phần của chính nó trên ring dựa trên giá trị hash, đồng thời giữ replica của các virtual node khác.

Nếu thêm một node mới vào cluster, nó sẽ tự động rebalance virtual node trên tất cả node. Không cần reshard thủ công. Xem tài liệu chính thức của Cassandra[^21] để biết thêm chi tiết.

#### Vấn đề hotspot

Shard hoặc service nhận lượng dữ liệu lớn hơn nhiều so với các shard hoặc service khác được gọi là hotspot. Điều này xảy ra vì các công ty lớn có ngân sách quảng cáo lên đến hàng triệu đô la, nên quảng cáo của họ được click thường xuyên hơn. Vì các sự kiện được partition theo `ad_id`, một số node aggregation service có thể nhận nhiều sự kiện click quảng cáo hơn rất nhiều so với các node khác, từ đó có thể khiến server bị quá tải.

Có thể giảm nhẹ vấn đề này bằng cách phân bổ thêm aggregation node để xử lý các quảng cáo hot. Hãy xem một ví dụ, như trong Hình 25. Giả sử mỗi aggregation node chỉ có thể xử lý 100 event.

1. Vì aggregation node có 300 event (vượt quá khả năng xử lý của node), nó yêu cầu resource bổ sung từ resource manager.
2. Resource manager cấp thêm resource (ví dụ, tăng thêm 2 aggregation node) để aggregation node ban đầu không bị quá tải.
3. Aggregation node ban đầu chia các event thành 3 nhóm, mỗi aggregation node xử lý 100 event.
4. Kết quả được ghi trở lại aggregation node ban đầu.

![](../images/v2/chapter06/figure6-25.png)

Có những cách phức tạp hơn để xử lý vấn đề này, chẳng hạn global-local aggregation hoặc tách các aggregation khác nhau. Xem [^22] để biết thêm thông tin.

### Fault tolerance

Hãy thảo luận về fault tolerance của aggregation service. Vì việc tổng hợp được thực hiện trong memory, khi aggregation node gặp sự cố thì kết quả tổng hợp cũng mất. Chúng ta có thể xây dựng lại count bằng cách replay event từ upstream Kafka.

Bắt đầu replay dữ liệu từ Kafka rất chậm. Một cách làm tốt là lưu “system state”, chẳng hạn upstream offset, vào snapshot và khôi phục từ state được lưu gần nhất. Trong thiết kế của chúng ta, “system state” không chỉ là upstream offset vì chúng ta còn cần lưu dữ liệu như các quảng cáo có số lượt click cao nhất $N$ trong $M$ phút vừa qua.

Hình 26 cho thấy một ví dụ đơn giản về dữ liệu trong snapshot.

![](../images/v2/chapter06/figure6-26.png)

Với snapshot, quy trình khôi phục sau sự cố của aggregation service rất đơn giản. Nếu một node aggregation service thất bại, chúng ta khởi động node mới và khôi phục dữ liệu từ snapshot mới nhất (Hình 27). Nếu có sự kiện mới đến sau lần chụp snapshot cuối cùng, aggregation node mới sẽ pull dữ liệu này từ Kafka broker để replay.

![](../images/v2/chapter06/figure6-27.png)

### Data monitoring và tính đúng đắn

Như đã đề cập, kết quả tổng hợp có thể được dùng cho mục đích RTB và tính phí. Việc monitor tình trạng hệ thống và đảm bảo tính đúng đắn là rất quan trọng.

#### Continuous monitoring

Dưới đây là một số metric chúng ta có thể muốn monitor:

- Độ trễ: vì mỗi stage đều có thể tạo thêm độ trễ, việc theo dõi timestamp khi event đi qua các phần khác nhau của hệ thống là rất hữu ích. Chênh lệch giữa các timestamp đó có thể được expose dưới dạng metric độ trễ.
- Kích thước message queue: nếu kích thước queue đột ngột tăng, chúng ta có thể cần thêm aggregation node. Lưu ý rằng Kafka là một message queue được triển khai dưới dạng distributed commit log, vì vậy chúng ta cần monitor metric record lag.
- System resource trên aggregation node: CPU, disk, JVM, v.v.

### Đối soát

Đối soát là việc so sánh các dataset khác nhau để đảm bảo tính toàn vẹn của dữ liệu. Không giống đối soát trong ngành ngân hàng, kết quả của việc tổng hợp click quảng cáo không có kết quả từ bên thứ ba để đối soát.

Việc chúng ta có thể làm là vào cuối mỗi ngày, dùng batch job sắp xếp các sự kiện click quảng cáo theo event time rồi đối soát với kết quả tổng hợp real-time. Nếu yêu cầu về độ chính xác cao hơn, chúng ta có thể sử dụng aggregation window nhỏ hơn; ví dụ một giờ. Lưu ý rằng bất kể sử dụng aggregation window nào, kết quả của batch job có thể không khớp hoàn toàn với kết quả tổng hợp real-time vì một số sự kiện có thể đến muộn (xem phần Time).

Hình 28 cho thấy sơ đồ thiết kế cuối cùng có hỗ trợ đối soát.

![](../images/v2/chapter06/figure6-28.png)

### Thiết kế khác

Trong một buổi phỏng vấn system design thông thường, bạn không cần hiểu cách hoạt động bên trong của các phần mềm chuyên dụng khác nhau trong big data pipeline. Việc giải thích quá trình suy nghĩ và thảo luận về trade-off rất quan trọng, đó là lý do chúng ta đề xuất một giải pháp tổng quát. Một lựa chọn khác là lưu dữ liệu click quảng cáo trong Hive và xây dựng một layer ElasticSearch để query nhanh hơn. Việc tổng hợp thường được thực hiện trong OLAP database, chẳng hạn ClickHouse[^23] hoặc Druid[^24]. Hình 29 cho thấy kiến trúc này.

![](../images/v2/chapter06/figure6-29.png)

Xem tài liệu tham khảo[^25] để biết thêm chi tiết.

## Bước 4 - Tóm tắt

Trong chương này, chúng ta đã tìm hiểu cách thiết kế một hệ thống tổng hợp sự kiện click quảng cáo ở quy mô Facebook hoặc Google. Chúng ta đã đề cập đến:

- Data model và thiết kế API.
- Sử dụng paradigm MapReduce để tổng hợp các sự kiện click quảng cáo.
- Scale message queue, aggregation service và database.
- Giảm nhẹ vấn đề hotspot.
- Continuous monitoring hệ thống.
- Sử dụng đối soát để đảm bảo tính đúng đắn.
- Fault tolerance.

Hệ thống tổng hợp sự kiện click quảng cáo là một hệ thống xử lý big data điển hình. Nếu đã có kiến thức hoặc kinh nghiệm trước đó với các giải pháp tiêu chuẩn trong ngành như Apache Kafka, Apache Flink hoặc Apache Spark, bạn sẽ dễ hiểu và thiết kế hệ thống hơn.

Chúc mừng bạn đã đi đến bước này! Giờ hãy tự vỗ vai mình một cái. Làm tốt lắm!

[^1]: Tỷ lệ click (CTR): Định nghĩa: https://support.google.com/google-ads/answer/2615875?hl=en
[^2]: Tỷ lệ chuyển đổi: Định nghĩa: https://support.google.com/google-ads/answer/2684489?hl=en
[^3]: Hàm OLAP: https://docs.oracle.com/database/121/OLAXS/olap_functions.htm#OLAXS169
[^4]: Quảng cáo hiển thị với đấu giá thời gian thực (RTB) và nhắm mục tiêu theo hành vi: https://arxiv.org/pdf/1610.03013.pdf
[^5]: LanguageManual ORC: https://cwiki.apache.org/confluence/display/hive/languagemanual+orc
[^6]: Parquet: https://databricks.com/glossary/what-is-parquet
[^7]: Avro là gì: https://www.ibm.com/topics/avro
[^8]: Big Data: https://www.datakwery.com/techniques/big-data/
[^9]: Tổng quan về xử lý exactly-once end-to-end trong Apache Flink: https://flink.apache.org/features/2018/03/01/end-to-end-exactly-once-apache-flink.html
[^10]: Mô hình DAG: https://en.wikipedia.org/wiki/Directed_acyclic_graph
[^11]: Tìm hiểu star schema và tầm quan trọng đối với Power BI: https://docs.microsoft.com/en-us/power-bi/guidance/star-schema
[^12]: Martin Kleppmann. Designing Data-Intensive Applications. O’Reilly Media, 2017.
[^13]: Apache Flink: https://flink.apache.org/
[^14]: Kiến trúc Lambda: https://databricks.com/glossary/lambda-architecture
[^15]: Kiến trúc Kappa: https://hazelcast.com/glossary/kappa-architecture
[^16]: Martin Kleppmann. Stream Processing. Trong Designing Data-Intensive Applications. O’Reilly Media, 2017.
[^17]: Tổng hợp exactly-once end-to-end trên luồng quảng cáo: https://www.youtube.com/watch?v=hzxytnPcAUM
[^18]: Chất lượng traffic quảng cáo: https://www.google.com/ads/adtrafficquality/
[^19]: Tìm hiểu MapReduce trong Hadoop: https://www.section.io/engineering-education/understanding-map-reduce-in-hadoop/
[^20]: Flink trên Apache Yarn: https://ci.apache.org/projects/flink/flink-docs-release-1.13/docs/deployment/resource-providers/yarn/
[^21]: Cách dữ liệu được phân phối trên một cluster (sử dụng virtual node): https://docs.datastax.com/en/cassandra-oss/3.0/cassandra/architecture/archDataDistributeDistribute.html
[^22]: Tối ưu hiệu năng Flink: https://nightlies.apache.org/flink/flink-docs-master/docs/dev/table/tuning/
[^23]: ClickHouse: https://clickhouse.com/
[^24]: Druid: https://druid.apache.org/
[^25]: Xử lý sự kiện quảng cáo exactly-once theo thời gian thực với Apache Flink, Kafka và Pinot: https://eng.uber.com/real-time-exactly-once-ad-event-processing/
