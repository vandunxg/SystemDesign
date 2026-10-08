# Chương 5 Hệ thống giám sát metrics và cảnh báo

---

Trong chương này, chúng ta sẽ tìm hiểu thiết kế của một hệ thống giám sát metrics và cảnh báo có khả năng mở rộng. Một hệ thống giám sát và cảnh báo được thiết kế tốt đóng vai trò quan trọng trong việc thể hiện rõ tình trạng của hạ tầng, qua đó bảo đảm tính sẵn sàng cao và độ tin cậy.

Hình 1 cho thấy một số dịch vụ giám sát metrics và cảnh báo phổ biến nhất trên thị trường. Trong chương này, chúng ta sẽ thiết kế một dịch vụ tương tự để sử dụng nội bộ trong các công ty lớn.

![Figure5.1.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.1.png)

Hình 1 Các dịch vụ giám sát metrics và cảnh báo phổ biến

## Bước 1 - Tìm hiểu vấn đề và xác định phạm vi thiết kế

Hệ thống giám sát metrics và cảnh báo có thể mang nhiều ý nghĩa khác nhau với các công ty khác nhau, vì vậy trước hết cần làm rõ yêu cầu với interviewer. Ví dụ, nếu interviewer chỉ nghĩ đến metrics hạ tầng, chắc chắn bạn không muốn thiết kế một hệ thống tập trung vào log (chẳng hạn như log lỗi hoặc log truy cập của Web server).

Trước khi đi sâu vào chi tiết, hãy cùng tìm hiểu đầy đủ vấn đề và xác định phạm vi thiết kế.

**Ứng viên**: Chúng ta xây dựng hệ thống này cho ai? Đây là hệ thống nội bộ cho một công ty lớn như Facebook hoặc Google, hay là một dịch vụ SaaS như Datadog [1], Splunk [2]?
**Interviewer**: Đây là một câu hỏi hay. Chúng ta chỉ xây dựng hệ thống để sử dụng nội bộ.

**Ứng viên**: Chúng ta muốn thu thập những metrics nào?
**Interviewer**: Chúng ta muốn thu thập metrics của các hệ thống vận hành. Đây có thể là dữ liệu sử dụng cấp thấp của hệ điều hành, chẳng hạn như tải CPU, mức sử dụng bộ nhớ và mức tiêu thụ dung lượng đĩa. Cũng có thể là các metrics ở cấp cao hơn, chẳng hạn như số request mỗi giây của một service hoặc số server đang hoạt động trong một pool Web server. Metrics nghiệp vụ không nằm trong phạm vi của thiết kế này.

**Ứng viên**: Hạ tầng được giám sát bằng hệ thống này có quy mô lớn đến mức nào?
**Interviewer**: 100 triệu người dùng hoạt động hằng ngày, 1,000 server pool, mỗi pool có 100 máy.

**Ứng viên**: Chúng ta cần lưu dữ liệu trong bao lâu?
**Interviewer**: Giả sử chúng ta muốn thời gian lưu trữ là 1 năm.

**Ứng viên**: Chúng ta có thể giảm resolution của dữ liệu metrics để lưu trữ dài hạn không?
**Interviewer**: Đây là một câu hỏi hay. Chúng ta muốn giữ dữ liệu mới nhận trong 7 ngày. Sau 7 ngày, bạn có thể roll up dữ liệu thành resolution 1 phút và giữ trong 30 ngày. Sau 30 ngày, bạn có thể tiếp tục roll up thành resolution 1 giờ.

**Ứng viên**: Những kênh cảnh báo nào được hỗ trợ?
**Interviewer**: Email, điện thoại, PagerDuty [3] hoặc webhook (HTTP endpoint).

**Ứng viên**: Chúng ta có cần thu thập log, chẳng hạn như log lỗi hoặc log truy cập không?
**Interviewer**: Không cần.

**Ứng viên**: Chúng ta có cần hỗ trợ distributed system tracing không?
**Interviewer**: Không cần.

### Yêu cầu và giả định cấp cao
Bạn đã hoàn tất việc thu thập yêu cầu từ interviewer và có phạm vi thiết kế rõ ràng. Các yêu cầu như sau:

*   Hạ tầng được giám sát có quy mô cực lớn.
    *   100 triệu người dùng hoạt động hằng ngày
    *   Giả sử có 1,000 server pool, mỗi pool có 100 máy, mỗi máy có 100 metrics => ~1000 vạn metrics
    *   Thời gian lưu dữ liệu là 1 năm
    *   Chính sách lưu dữ liệu: dữ liệu thô giữ 7 ngày, resolution 1 phút giữ 30 ngày, resolution 1 giờ giữ 1 năm
*   Có thể giám sát nhiều loại metrics, bao gồm nhưng không giới hạn ở:
    *   Mức sử dụng CPU
    *   Số lượng request
    *   Mức sử dụng bộ nhớ
    *   Số lượng message trong message queue

### Yêu cầu phi chức năng

*   Khả năng mở rộng. Hệ thống phải có thể mở rộng để đáp ứng lượng metrics và cảnh báo ngày càng tăng.
*   Độ trễ thấp. Hệ thống cần cung cấp query latency thấp cho dashboard và cảnh báo.
*   Độ tin cậy. Hệ thống phải có độ tin cậy cao để tránh bỏ sót các cảnh báo quan trọng.
*   Tính linh hoạt. Công nghệ luôn thay đổi, vì vậy pipeline phải đủ linh hoạt để dễ dàng tích hợp công nghệ mới trong tương lai.

Những yêu cầu nào nằm ngoài phạm vi?

*   Giám sát log. Stack Elasticsearch, Logstash, Kibana (ELK) rất phổ biến trong việc thu thập và giám sát log [4].
*   Distributed system tracing [5] [6]. Distributed tracing là một giải pháp theo dõi request service khi chúng đi qua một hệ thống phân tán. Nó thu thập dữ liệu khi request chuyển từ service này sang service khác.

## Bước 2 - Đề xuất thiết kế cấp cao và nhận sự đồng thuận

Trong phần này, chúng ta sẽ thảo luận về một số kiến thức nền tảng, data model và thiết kế cấp cao để xây dựng hệ thống.

### Kiến thức nền tảng
Một hệ thống giám sát metrics và cảnh báo thường gồm năm thành phần, như minh họa trong Hình 2.


1. Data collection
2. Data transmission
3. Data storage
4. Alerting
5. Visualization

![Figure5.2.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.2.png)
Hình 2 Năm thành phần của hệ thống

1. Data collection: Thu thập dữ liệu metrics từ nhiều nguồn khác nhau.
2. Data transmission: Truyền dữ liệu từ nguồn đến hệ thống giám sát metrics.
3. Data storage: Sắp xếp và lưu trữ dữ liệu nhận được.
4. Alerting: Phân tích dữ liệu nhận được, phát hiện bất thường và tạo cảnh báo. Hệ thống phải có khả năng gửi cảnh báo đến các kênh liên lạc khác nhau.
5. Visualization: Hiển thị dữ liệu dưới dạng đồ thị, biểu đồ, v.v. Khi dữ liệu được trình bày dưới dạng trực quan, engineer có thể nhận diện pattern, trend hoặc vấn đề tốt hơn, vì vậy chúng ta cần chức năng visualization.

### Data model
Dữ liệu metrics thường được ghi lại dưới dạng time series, bao gồm một tập hợp các value cùng timestamp tương ứng. Bản thân sequence có thể được định danh duy nhất bằng tên, và có thể được định danh thêm bằng một tập hợp label.

Hãy xem hai ví dụ.

Ví dụ 1: Load CPU của instance server production i631 lúc 20:00 là bao nhiêu?

![Figure5.3.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.3.png)

Hình 3 Load CPU

Data point được làm nổi bật trong Hình 3 có thể được biểu diễn bằng Bảng 1.

| metric_name | cpu.load |
| :--- | :--- |
| labels | host:i631,env:prod |
| timestamp | 1613707265 |
| value | 0.29 |

Bảng 1 Data point được biểu diễn dưới dạng bảng

Trong ví dụ này, time series được biểu diễn bằng tên metric, label (host:i631,env:prod) và một value tại một thời điểm cụ thể.

Ví dụ 2: Load CPU trung bình của tất cả Web server trong vùng us-west trong 10 phút vừa qua là bao nhiêu? Về mặt khái niệm, chúng ta sẽ lấy từ storage dữ liệu sau, trong đó tên metric là “CPU.load” và label vùng là “us-west”:

CPU.load host=webserver01,region=us-west 1613707265 50  
CPU.load host=webserver01,region=us-west 1613707265 62  
CPU.load host=webserver02,region=us-west 1613707265 43  
CPU.load host=webserver02,region=us-west 1613707265 53  
...  
CPU.load host=webserver01,region=us-west 1613707265 76  
CPU.load host=webserver01,region=us-west 1613707265 83  

Load CPU trung bình có thể được tính bằng cách lấy trung bình các value ở cuối mỗi dòng. Format của các dòng trong ví dụ trên được gọi là line protocol. Đây là format input phổ biến của nhiều phần mềm monitoring trên thị trường. Prometheus [7] và OpenTSDB [8] là hai ví dụ điển hình.

Mỗi time series gồm các thành phần sau [9]:

| Tên | Kiểu |
| :--- | :--- |
| Tên metric (A metric name) | String |
| Một tập hợp label (A set of tags/labels) | Danh sách các cặp key-value <key:value> |
| Một tập hợp value và timestamp tương ứng (An array of values and their timestamps) | Mảng các cặp <value, timestamp> |

Bảng 2 Time series

### Data access pattern

![Figure5.4.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.4.png)

Hình 4 Data access pattern

Trong Hình 4, mỗi label trên trục y đại diện cho một time series (được định danh duy nhất bằng tên và label), còn trục x đại diện cho thời gian.

Write load rất nặng. Như bạn thấy, tại bất kỳ thời điểm nào cũng có thể có rất nhiều data point của time series được ghi. Như đã đề cập trong phần “Yêu cầu cấp cao”, mỗi ngày có khoảng 1000 vạn metrics vận hành được ghi, và nhiều metric được thu thập với tần suất cao, vì vậy traffic chắc chắn là write-heavy.

Trong khi đó, read load có tính burst. Cả service visualization và alerting đều gửi query đến database, và lượng read có thể tăng đột biến tùy theo access pattern của biểu đồ và cảnh báo.

Nói cách khác, hệ thống chịu write load nặng liên tục, trong khi read load có tính burst.

### Hệ thống lưu trữ dữ liệu
Hệ thống lưu trữ dữ liệu là cốt lõi của thiết kế. Không nên tự xây dựng storage system cho công việc này hoặc sử dụng một hệ thống lưu trữ đa dụng như MySQL.

Về lý thuyết, database đa dụng có thể hỗ trợ dữ liệu time series, nhưng cần tuning ở mức chuyên gia mới có thể chạy ở quy mô của chúng ta. Cụ thể, relational database không được tối ưu cho nhiều thao tác thường thực hiện trên dữ liệu time series. Ví dụ, việc tính moving average trong một cửa sổ thời gian trượt cần SQL phức tạp và khó đọc (chương tìm hiểu chuyên sâu có một ví dụ về việc này). Ngoài ra, để hỗ trợ việc đánh dấu/tag dữ liệu, chúng ta cần thêm index cho từng label. Hơn nữa, relational database đa dụng hoạt động không tốt dưới write load nặng liên tục. Ở quy mô này, chúng ta sẽ phải bỏ ra rất nhiều công sức để tuning database, nhưng ngay cả như vậy hiệu năng của nó vẫn có thể không đáp ứng được.

Vậy còn NoSQL thì sao? Về lý thuyết, một số NoSQL database trên thị trường có thể xử lý dữ liệu time series hiệu quả. Ví dụ, Cassandra và Bigtable [11] đều có thể được sử dụng cho dữ liệu time series. Tuy nhiên, để thiết kế một kiến trúc có khả năng mở rộng nhằm lưu trữ và query dữ liệu time series hiệu quả, cần hiểu sâu về cách hoạt động bên trong của từng NoSQL. Vì các time-series database (TSDB) cấp production có sẵn đã rất trưởng thành, sử dụng NoSQL database đa dụng không phải lựa chọn lý tưởng.

Hiện nay có nhiều storage system được tối ưu cho dữ liệu time series. Việc tối ưu này cho phép chúng ta xử lý cùng một quy mô dữ liệu bằng ít server hơn rất nhiều so với database đa dụng. Nhiều database trong số đó còn có query interface tùy chỉnh được thiết kế riêng để phân tích dữ liệu time series, dễ sử dụng hơn SQL nhiều. Một số thậm chí còn cung cấp chức năng quản lý data retention và data aggregation. Dưới đây là một số ví dụ về time-series database.

OpenTSDB là một distributed time-series database, nhưng vì được xây dựng trên Hadoop và HBase nên việc chạy một cluster Hadoop/HBase làm tăng độ phức tạp. Twitter sử dụng MetricsDB [12], còn Amazon cung cấp time-series database Timestream [13]. Theo dữ liệu từ DB-engines [14], hai time-series database phổ biến nhất là InfluxDB [15] và Prometheus, được thiết kế để lưu trữ lượng lớn time series data và thực hiện real-time analysis nhanh chóng. Cả hai chủ yếu dựa vào memory cache và disk storage. Chúng cũng có hiệu năng và độ bền khá tốt. Như Hình 5 minh họa, một InfluxDB với 8 core và 32GB RAM có thể xử lý hơn 250,000 write mỗi giây.

![Figure5.5.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.5.png)

Hình 5 Benchmark InfluxDB

Vì time-series database là database chuyên dụng, trừ khi bạn đã nêu rõ trong CV rằng mình từng làm việc với chúng, bạn không cần biết chi tiết bên trong của chúng khi phỏng vấn. Trong bối cảnh phỏng vấn, điều quan trọng là hiểu rằng dữ liệu metrics về bản chất là time series, và chúng ta có thể chọn một time-series database như InfluxDB để lưu trữ chúng.

Một đặc điểm khác của time-series database mạnh là khả năng aggregate và phân tích hiệu quả lượng lớn time-series data dựa trên label (ở một số database còn gọi là tag). Ví dụ, InfluxDB xây dựng index cho label để hỗ trợ tìm time series nhanh bằng label [15]. Nó cung cấp hướng dẫn best practice rõ ràng về cách sử dụng label mà không làm database quá tải. Điều quan trọng là bảo đảm mỗi label có cardinality thấp (low cardinality), tức là chỉ có một tập hợp nhỏ các value có thể có. Tính năng này rất quan trọng đối với visualization, còn triển khai nó bằng database đa dụng sẽ cần rất nhiều công sức.

## Thiết kế cấp cao
Sơ đồ thiết kế cấp cao được minh họa trong Hình 6.

![Figure5.6.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.6.png)

Hình 6 Thiết kế cấp cao

*   Metrics source. Đây có thể là application server, SQL database, message queue, v.v.
*   Metrics collector. Thành phần này thu thập dữ liệu metrics và ghi vào time-series database.
*   Time-series database. Thành phần này lưu trữ dữ liệu metrics dưới dạng time series. Nó thường cung cấp query interface tùy chỉnh để phân tích và aggregate lượng lớn time-series data. Nó duy trì index của label để hỗ trợ tìm dữ liệu time series nhanh bằng label.
*   Query service. Query service giúp việc query và lấy dữ liệu từ time-series database trở nên dễ dàng. Nếu chọn được một time-series database tốt, đây chỉ nên là một lớp wrapper rất mỏng. Nó cũng có thể được thay thế hoàn toàn bằng query interface của chính time-series database.
*   Alerting system. Thành phần này gửi notification cảnh báo đến nhiều alert receiver khác nhau.
*   Visualization system. Thành phần này hiển thị metrics dưới nhiều dạng graph/chart khác nhau.

## Bước 3 - Tìm hiểu chuyên sâu
Trong system design interview, ứng viên thường cần tìm hiểu sâu một số component hoặc flow quan trọng. Trong phần này, chúng ta sẽ nghiên cứu chi tiết các chủ đề sau:

*   Thu thập metrics
*   Mở rộng metrics transmission pipeline
*   Query service
*   Storage layer
*   Alerting system
*   Visualization system

### Thu thập metrics
Đối với việc thu thập các metric như counter hoặc mức sử dụng CPU, thỉnh thoảng mất dữ liệu không phải vấn đề lớn. Client sử dụng cách “fire and forget” là chấp nhận được. Bây giờ hãy xem flow thu thập metrics. Phần này của hệ thống nằm trong khung nét đứt (Hình 7).

![Figure5.7.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.7.png)

Hình 7 Flow thu thập metrics

## Pull model vs push model
Có hai cách thu thập dữ liệu metrics: pull hoặc push. Việc cách nào tốt hơn luôn là một chủ đề tranh luận phổ biến và không có câu trả lời tiêu chuẩn. Hãy cùng xem xét kỹ hơn.

### Pull model
Hình 8 minh họa việc thu thập dữ liệu theo pull model qua HTTP. Chúng ta có các metrics collector chuyên dụng, định kỳ pull giá trị metrics từ những application đang chạy.

![Figure5.8.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.8.png)

Hình 8 Pull model

Với cách tiếp cận này, metrics collector cần biết đầy đủ danh sách tất cả service endpoint mà nó sẽ pull dữ liệu. Một cách sơ khai là dùng một file trên server “metrics collector” để lưu thông tin DNS/IP của từng service endpoint. Ý tưởng này đơn giản nhưng khó duy trì trong môi trường quy mô lớn, vì server thường xuyên được thêm hoặc gỡ bỏ, và chúng ta phải bảo đảm metrics collector không bỏ sót việc thu thập metrics từ bất kỳ server mới nào. Tin tốt là chúng ta có một giải pháp đáng tin cậy, có khả năng mở rộng và dễ bảo trì: sử dụng **Service Discovery**, được cung cấp bởi etcd [16], ZooKeeper [17], v.v. Trong đó, service đăng ký trạng thái sẵn sàng của mình, còn metrics collector có thể được service discovery component thông báo khi danh sách service endpoint thay đổi.

Service discovery chứa các rule cấu hình về thời điểm và nơi cần thu thập metrics, như minh họa trong Hình 9.

![Figure5.9.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.9.png)

Hình 9 Service discovery

Hình 10 giải thích chi tiết pull model.

![Figure5.10.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.10.png)

Hình 10 Chi tiết pull model

Metrics collector lấy configuration metadata của service endpoint từ service discovery. Metadata bao gồm pull interval, IP address, timeout và retry parameter, v.v.  
Metrics collector pull dữ liệu metrics qua HTTP endpoint được định nghĩa trước (chẳng hạn `/metrics`). Để expose endpoint này, thông thường cần thêm một client library vào service. Trong Hình 10, service đó là Web server.  
(Tùy chọn) Metrics collector có thể đăng ký nhận notification về change event trong service discovery để nhận update khi service endpoint thay đổi. Ngoài ra, metrics collector có thể định kỳ poll các thay đổi của endpoint.

Ở quy mô của chúng ta, một metrics collector duy nhất không thể xử lý hàng chục nghìn server. Chúng ta phải sử dụng một metrics collector pool để xử lý yêu cầu. Khi có nhiều collector, một vấn đề phổ biến là nhiều instance có thể cùng cố gắng pull dữ liệu từ một resource và tạo ra dữ liệu trùng lặp. Giữa các instance phải có một coordination scheme nào đó để tránh tình trạng này.

Một cách khả thi là chỉ định một range trong consistent hash ring cho mỗi collector, sau đó map từng server được giám sát lên hash ring bằng tên duy nhất của nó. Điều này bảo đảm một metrics source server chỉ được một collector xử lý. Hãy xem một ví dụ.

Như Hình 11 minh họa, có bốn collector và sáu metrics source server. Mỗi collector chịu trách nhiệm thu thập metrics từ một nhóm server khác nhau. Collector 2 chịu trách nhiệm thu thập metrics từ server 1 và server 5.

![Figure5.11.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.11.png)

Hình 11 Consistent hashing

### Push model
Như Hình 12 minh họa, trong push model, nhiều metrics source khác nhau (chẳng hạn Web server, database server, v.v.) gửi metrics trực tiếp đến metrics collector.

![Figure5.12.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.12.png)

Hình 12 Push model

Trong push model, thông thường một **collection agent** được cài đặt trên mỗi server được giám sát. Collection agent là phần mềm chạy lâu dài, thu thập metrics từ các service đang chạy trên server và định kỳ push các metrics này đến metrics collector. Collection agent cũng có thể aggregate metrics cục bộ trước khi gửi chúng đến metrics collector (đặc biệt là các counter đơn giản).

Aggregation là cách hiệu quả để giảm lượng dữ liệu gửi đến metrics collector. Nếu push traffic cao và metrics collector từ chối push vì lỗi, agent có thể giữ một buffer dữ liệu nhỏ cục bộ (có thể bằng cách lưu trên local disk) và retry sau đó. Tuy nhiên, nếu server nằm trong một auto-scaling group thường xuyên được rotate, việc giữ dữ liệu cục bộ (dù chỉ tạm thời) có thể làm mất dữ liệu khi metrics collector bị chậm.

Để ngăn metrics collector bị chậm trong push model, metrics collector nên nằm trong một auto-scaling cluster có load balancer đứng phía trước (Hình 13). Cluster này nên được scale ngang dựa trên CPU load của metrics collector server.

![Figure5.13.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.13.png)

Hình 13 Load balancer

### Pull hay push?
Vậy lựa chọn nào tốt hơn cho chúng ta? Cũng như nhiều vấn đề trong cuộc sống, không có câu trả lời rõ ràng. Cả hai đều có những use case thực tế được áp dụng rộng rãi.

*   Ví dụ về kiến trúc pull gồm Prometheus.
*   Ví dụ về kiến trúc push gồm Amazon CloudWatch [18] và Graphite [19].

Hiểu ưu và nhược điểm của từng cách tiếp cận quan trọng hơn việc phân định thắng thua giữa chúng trong phỏng vấn. Bảng 3 so sánh ưu nhược điểm của kiến trúc push và pull [20] [21] [22] [23].

| | Pull | Push |
| :--- | :--- | :--- |
| **Dễ debug** | Endpoint `/metrics` trên application server có thể được dùng để xem metrics bất cứ lúc nào. Bạn thậm chí có thể thực hiện việc này trên laptop. **Pull thắng.** | |
| **Health check** | Nếu application server không phản hồi việc pull, bạn có thể nhanh chóng xác định application server đó đã down hay chưa. **Pull thắng.** | Nếu metrics collector không nhận được metrics, vấn đề có thể do network gây ra. |
| **Task ngắn hạn** | | Một số batch job có thể có thời gian sống ngắn, không đủ lâu để được pull. **Push thắng.** Có thể giải quyết việc này bằng cách đưa push gateway vào pull model [24]. |
| **Firewall hoặc network setting phức tạp** | Server pull metrics cần truy cập được tất cả metrics endpoint. Điều này có thể gây vấn đề trong môi trường nhiều data center. Nó có thể cần network infrastructure phức tạp hơn. | Nếu metrics collector được cấu hình với load balancer và auto-scaling group, nó có thể nhận dữ liệu từ bất kỳ đâu. **Push thắng.** |
| **Performance** | Phương thức pull thường sử dụng TCP. | Phương thức push thường sử dụng UDP. Điều này có nghĩa phương thức push cung cấp việc truyền metrics với độ trễ thấp hơn. Quan điểm đối lập ở đây là overhead của việc thiết lập TCP connection khá nhỏ so với việc gửi metrics payload. |
| **Tính xác thực của dữ liệu** | Application server mà metrics được thu thập từ đó được định nghĩa trước trong configuration file. Metrics thu thập từ các server này được bảo đảm là xác thực. | Client thuộc bất kỳ loại nào cũng có thể push metrics đến metrics collector. Có thể giải quyết việc này bằng cách whitelist các server được phép nhận metrics hoặc yêu cầu authentication. |

Bảng 3 Pull vs push

Như đã nói ở trên, pull hay push là một chủ đề tranh luận phổ biến và không có câu trả lời rõ ràng. Một tổ chức lớn có thể cần hỗ trợ cả hai, đặc biệt khi xét đến sự phổ biến của serverless [25] hiện nay. Trong một số trường hợp, có thể hoàn toàn không cài được agent để push dữ liệu.

## Mở rộng metrics transmission pipeline

![Figure5.14.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.14.png)

Hình 14 Metrics transmission pipeline

Hãy phóng to để quan sát metrics collector và time-series database. Dù sử dụng push hay pull model, metrics collector đều là một server cluster nhận lượng dữ liệu khổng lồ. Dù là push hay pull, metrics collector cluster đều được cấu hình auto-scaling để bảo đảm có đủ collector instance xử lý yêu cầu.

Tuy nhiên, nếu time-series database không khả dụng thì có nguy cơ mất dữ liệu. Để giảm thiểu vấn đề này, chúng ta đưa vào một queue component, như minh họa trong Hình 15.

![Figure5.15.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.15.png)

Hình 15 Thêm queue

Trong thiết kế này, metrics collector gửi dữ liệu metrics đến một queue system như Kafka. Sau đó, consumer hoặc stream processing service như Apache Storm, Flink và Spark xử lý dữ liệu rồi push vào time-series database. Cách tiếp cận này có một số ưu điểm:
*   Kafka được sử dụng như một distributed messaging platform có độ tin cậy và khả năng mở rộng cao.
*   Nó tách rời data collection service và data processing service.
*   Bằng cách giữ dữ liệu trong Kafka, có thể dễ dàng ngăn mất dữ liệu khi database không khả dụng.

### Mở rộng qua Kafka
Chúng ta có thể tận dụng partition mechanism tích hợp sẵn của Kafka để mở rộng hệ thống theo một số cách:
*   Cấu hình số lượng partition dựa trên yêu cầu throughput.
*   Partition dữ liệu metrics theo tên metric để consumer có thể aggregate dữ liệu theo tên metric.

![Figure5.16.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.16.png)

Hình 16 Kafka partition

*   Sử dụng tag/label để partition dữ liệu metrics sâu hơn.
*   Phân loại và xác định priority cho metrics để metrics quan trọng được xử lý trước.

### Giải pháp thay thế Kafka
Vận hành một hệ thống Kafka ở quy mô production hoàn toàn không dễ dàng. Interviewer có thể chất vấn bạn về điểm này. Hiện đã có các ingestion system dùng cho monitoring quy mô lớn chạy mà không cần intermediate queue. Gorilla [26], một in-memory time-series database của Facebook, là ví dụ điển hình; nó được thiết kế để vẫn duy trì write availability cao khi xảy ra local network failure. Có thể xem thiết kế như vậy đáng tin cậy tương đương với việc có một intermediate queue như Kafka.

### Aggregation có thể diễn ra ở đâu
Metrics có thể được aggregate ở nhiều nơi: trong collection agent (client), trong ingestion pipeline (trước khi ghi vào storage) và ở query side (sau khi ghi vào storage). Hãy cùng xem xét kỹ hơn.

**Collection agent**. Collection agent được cài trên client chỉ hỗ trợ logic aggregation đơn giản. Ví dụ, aggregate counter mỗi phút một lần trước khi gửi đến metrics collector.

**Ingestion pipeline**. Để aggregate dữ liệu trước khi ghi vào storage, chúng ta thường cần stream processing engine như Flink. Vì chỉ có kết quả tính toán được ghi vào database nên lượng write sẽ giảm đáng kể. Tuy nhiên, xử lý các late-arriving event có thể là một thách thức; một nhược điểm khác là chúng ta mất độ chính xác dữ liệu và một phần tính linh hoạt vì không còn lưu dữ liệu thô.

**Query side**. Dữ liệu thô có thể được aggregate tại thời điểm query trong một khoảng thời gian nhất định. Cách này không làm mất dữ liệu, nhưng query có thể chậm hơn vì query result được tính tại thời điểm query và phải chạy trên toàn bộ dataset.

## Query service
Query service gồm một server cluster truy cập time-series database và xử lý request từ visualization system hoặc alerting system. Có một nhóm query server chuyên dụng giúp tách time-series database khỏi client (visualization và alerting system). Điều này cho phép chúng ta linh hoạt thay đổi time-series database hoặc visualization và alerting system bất cứ lúc nào theo nhu cầu.

### Cache layer
Để giảm tải cho time-series database và làm query service có hiệu năng tốt hơn, chúng ta thêm cache server để lưu query result, như minh họa trong Hình 17.

![Figure5.17.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.17.png)

Hình 17 Cache layer

### Lý do không sử dụng query service
Trên thực tế, không có nhu cầu cấp thiết phải đưa abstraction của riêng chúng ta (query service) vào, vì hầu hết visualization system và alerting system ở quy mô production đều có plugin mạnh để kết nối với các time-series database phổ biến trên thị trường. Hơn nữa, nếu chọn time-series database phù hợp thì thường cũng không cần thêm cache của riêng chúng ta.

### Query language của time-series database
Hầu hết hệ thống giám sát metrics phổ biến (như Prometheus và InfluxDB) không sử dụng SQL mà có query language riêng. Một lý do chính là SQL rất khó dùng để query dữ liệu time series. Ví dụ, như được đề cập ở đây [27], việc tính exponential moving average trong SQL có thể trông như sau:

```sql
select id,
    temp,
    avg (temp) over ( partition by group_nr order by time_read) as rolling_avg
from (
    select id,
    time,
    time_read,
    interval_group,
    id - row_number() over (partition by interval_group order by time_read) as group_nr
    from (
        select time_read,
        "epoch ":: timestamp + "900 seconds ":: interval * (
        extract ( epoch from time_read ):: int4 / 900) as interval_group,
        temp,
        from readings,
    ) t1
) t2
order by time_read;
 ```

Còn trong Flux (một ngôn ngữ được tối ưu cho time-series analysis, dùng cho InfluxDB), nó trông như sau. Như bạn thấy, cách này dễ hiểu hơn nhiều.

```flux
from(db:"telegraf")
|> range(start:-1h)
|> filter(fn: (r) => r._measurement == "foo")
|> exponentialMovingAverage(size:-10s)
```
## Storage layer
Bây giờ hãy đi sâu vào storage layer.

### Lựa chọn time-series database một cách cẩn thận
Theo một research paper do Facebook công bố [26], ít nhất 85% query trong việc lưu trữ dữ liệu vận hành nhắm đến dữ liệu được thu thập trong 26 giờ vừa qua. Nếu time-series database chúng ta sử dụng có thể tận dụng đặc điểm này, hiệu năng tổng thể của hệ thống sẽ được cải thiện đáng kể. Nếu bạn quan tâm đến thiết kế của storage engine, hãy tham khảo tài liệu thiết kế storage engine của InfluxDB [28].

### Tối ưu dung lượng
Như đã giải thích trong phần yêu cầu cấp cao, lượng dữ liệu metrics cần lưu trữ là rất lớn. Có một số giải pháp cho việc này.

#### Encoding và compression dữ liệu
Encoding và compression dữ liệu có thể giảm đáng kể kích thước dữ liệu. Những tính năng này thường được tích hợp trong các time-series database tốt. Dưới đây là một ví dụ đơn giản.

**Double-delta Encoding**

![Figure5.18.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.18.png)

Hình 18 Data encoding

Như hình trên minh họa, 1610087371 và 1610087381 chỉ chênh nhau 10 giây, chỉ cần 4 bit để biểu diễn thay vì dùng toàn bộ timestamp 32 bit. Vì vậy, thay vì lưu giá trị tuyệt đối, hãy lưu delta của các giá trị cùng một giá trị cơ sở, chẳng hạn: *1610087371, 10, 10, 9, 11*.

#### Downsampling
Downsampling là quá trình chuyển dữ liệu có resolution cao thành dữ liệu có resolution thấp hơn để giảm dung lượng disk tổng thể. Vì thời gian lưu dữ liệu của chúng ta là 1 năm, chúng ta có thể downsample dữ liệu cũ. Ví dụ, chúng ta có thể để engineer và data scientist định nghĩa rule cho các metrics khác nhau. Dưới đây là một ví dụ:

*   Thời gian lưu: 7 ngày, không sampling
*   Thời gian lưu: 30 ngày, downsample xuống resolution 1 phút
*   Thời gian lưu: 1 năm, downsample xuống resolution 1 giờ

Hãy xem một ví dụ cụ thể khác. Ví dụ này aggregate dữ liệu resolution 10 giây thành dữ liệu resolution 30 giây.

| metric | timestamp | hostname | metric_value |
| :--- | :--- | :--- | :--- |
| cpu | 2021-10-24T19:00:00Z | host-a | 10 |
| cpu | 2021-10-24T19:00:10Z | host-a | 16 |
| cpu | 2021-10-24T19:00:20Z | host-a | 20 |
| cpu | 2021-10-24T19:00:30Z | host-a | 30 |
| cpu | 2021-10-24T19:00:40Z | host-a | 20 |
| cpu | 2021-10-24T19:00:50Z | host-a | 30 |

Bảng 4 Dữ liệu resolution 10 giây

Aggregate dữ liệu resolution 10 giây thành dữ liệu resolution 30 giây:

| metric | timestamp | hostname | Metric_value (avg) |
| :--- | :--- | :--- | :--- |
| cpu | 2021-10-24T19:00:00Z | host-a | 19 |
| cpu | 2021-10-24T19:00:30Z | host-a | 25 |

Bảng 5 Dữ liệu resolution 30 giây

### Cold storage
Cold storage là hình thức lưu trữ dữ liệu ít được sử dụng và đang ở trạng thái không hoạt động. Chi phí tài chính của cold storage thấp hơn nhiều.

Nói ngắn gọn, có lẽ chúng ta nên sử dụng visualization system và alerting system của bên thứ ba thay vì tự xây dựng.

## Alert system
Với mục đích phỏng vấn, hãy xem alert system được minh họa trong Hình 19.

![Figure5.19.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.19.png)

Hình 19 Alert system

Alert flow như sau:
1. Load configuration file vào cache server. Rule được định nghĩa dưới dạng configuration file trên disk. YAML [29] là format phổ biến để định nghĩa rule. Dưới đây là ví dụ về một alert rule:

```yaml
- name: instance_down
  rules:

  # Gửi cảnh báo cho mọi instance không thể truy cập quá 5 phút (Alert for).
  - alert: instance_down
    expr: up == 0
    for: 5m
    labels:
      severity: page
```

2. Alert manager lấy alert configuration từ cache.
3. Dựa trên configuration rule, alert manager gọi query service theo các time interval được định nghĩa trước. Nếu value vi phạm threshold, một alert event được tạo. Alert manager chịu trách nhiệm cho các công việc sau:

*   Filter, merge và deduplicate alert.
*   Ví dụ: merge các alert được trigger trong cùng một instance (instance1).

![Figure5.20.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.20.png)

Hình 20 Merge alert

*   Access control: giới hạn quyền truy cập các thao tác quản lý alert nhất định trong phạm vi những cá nhân được cấp quyền.
*   Retry: bảo đảm notification được gửi ít nhất một lần bằng cách kiểm tra trạng thái alert.

4. Alert storage là một key-value database, chẳng hạn Cassandra, lưu trạng thái của tất cả alert (inactive, pending, firing, resolved). Nó bảo đảm notification được gửi ít nhất một lần.
5. Alert đáp ứng điều kiện được insert vào Kafka.
6. Alert consumer pull alert event từ Kafka.
7. Alert consumer xử lý alert event từ Kafka và gửi notification đến nhiều channel khác nhau, như email, SMS, PagerDuty hoặc HTTP endpoint.

### Alert system - tự xây dựng hay mua
Trên thị trường có rất nhiều alert system cấp production có sẵn, và phần lớn cung cấp integration chặt chẽ với các time-series database phổ biến. Nhiều alert system trong số này cũng tích hợp tốt với các notification channel hiện có như email và PagerDuty. Trong thực tế, rất khó tìm được lý do đủ thuyết phục để tự xây dựng alert system. Trong bối cảnh phỏng vấn, đặc biệt với vị trí senior, hãy chuẩn bị để bảo vệ quyết định của mình.

## Visualization system
Visualization được xây dựng trên data layer. Metrics có thể hiển thị trên các metrics dashboard với nhiều time span khác nhau, còn alert cũng có thể hiển thị trên alert dashboard. Hình 21 cho thấy một dashboard hiển thị một số metric như số request hiện tại của server, mức sử dụng memory/CPU, page load time, traffic và thông tin đăng nhập [30].

![Figure5.21.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.21.png)

Hình 21 Giao diện Grafana

Xây dựng một visualization system chất lượng cao rất khó. Có nhiều lý do chính đáng để sử dụng hệ thống có sẵn. Ví dụ, Grafana có thể là một hệ thống rất tốt cho mục đích này. Nó tích hợp rất tốt với nhiều time-series database phổ biến mà bạn có thể mua.

## Bước 4 - Tóm tắt

Trong chương này, chúng ta đã trình bày thiết kế của một hệ thống giám sát metrics và cảnh báo. Ở cấp cao, chúng ta đã thảo luận về data collection, time-series database, alerting và visualization. Sau đó, chúng ta đi sâu vào một số công nghệ/component quan trọng nhất:

*   Pull và push model để thu thập dữ liệu metrics.
*   Mở rộng hệ thống bằng Kafka.
*   Lựa chọn time-series database phù hợp.
*   Sử dụng downsampling để giảm quy mô dữ liệu.
*   Các lựa chọn tự xây dựng vs mua đối với alerting và visualization system.

Chúng ta đã qua một số lần lặp để hoàn thiện thiết kế, và thiết kế cuối cùng được minh họa trong Hình 22:

![Figure5.22.png](..%2Fimages%2Fv2%2Fchapter05%2FFigure5.22.png)

Hình 22 Thiết kế cuối cùng

Chúc mừng bạn đã học đến đây! Bây giờ hãy tự thưởng cho mình một chút. Làm tốt lắm!

## Tài liệu tham khảo

[1] Datadog: https://www.datadoghq.com/  
[2] Splunk: https://www.splunk.com/  
[3] PagerDuty: https://www.pagerduty.com/  
[4] Elastic stack: https://www.elastic.co/elastic-stack  
[5] Dapper, hạ tầng distributed system tracing quy mô lớn: https://research.google/pubs/pub36356/  
[6] Distributed system tracing với Zipkin: https://blog.twitter.com/engineering/en_us/a/2012/distributed-systems-tracing-with-zipkin.html  
[7] Prometheus: https://prometheus.io/docs/introduction/overview/  
[8] OpenTSDB - hệ thống monitoring phân tán, có khả năng mở rộng: http://opentsdb.net/  
[9] Data model: https://prometheus.io/docs/concepts/data_model/  
[10] MySQL: https://www.mysql.com/  
[11] Thiết kế schema cho dữ liệu time series | Tài liệu Cloud Bigtable: https://cloud.google.com/bigtable/docs/schema-design-time-series  
[12] MetricsDB, time-series database của Twitter: https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/metricsdb.html  
[13] Amazon Timestream: https://aws.amazon.com/timestream/  
[14] Xếp hạng time-series database của DB-Engines: https://db-engines.com/en/ranking/time+series+dbms  
[15] InfluxDB: https://www.influxdata.com/  
[16] etcd: https://etcd.io/  
[17] Service discovery với ZooKeeper: https://cloud.spring.io/spring-cloud-zookeeper/1.2.x/multi/multi_spring-cloud-zookeeper-discovery.html  
[18] Amazon CloudWatch: https://aws.amazon.com/cloudwatch/  
[19] Graphite: https://graphiteapp.org/  
[20] Push vs pull: http://bit.ly/3aIEPxE  
[21] Pull model không thể mở rộng - hay thực ra có thể?: https://prometheus.io/blog/2016/07/23/pull-does-not-scale-or-does-it/  
[22] Kiến trúc monitoring: https://developer.lightbend.com/guides/monitoring-at-scale/monitoring-architecture/architecture.html  
[23] Push vs pull trong monitoring system: https://giedrius.blog/2019/05/11/push-vs-pull-in-monitoring-systems/  
[24] Pushgateway: https://github.com/prometheus/pushgateway  
[25] Xây dựng application bằng serverless architecture: https://aws.amazon.com/lambda/serverless-architectures-learn-more/.  
[26] Gorilla: time-series database in-memory nhanh và có khả năng mở rộng: http://www.vldb.org/pvldb/vol8/p1816-teller.pdf  
[27] Tại sao chúng tôi xây dựng Flux, một data scripting và query language mới: https://www.influxdata.com/blog/why-were-building-flux-a-new-data-scripting-and-query-language/  
[28] InfluxDB storage engine: https://docs.influxdata.com/influxdb/v2.0/reference/internals/storage-engine/  
[29] YAML: https://en.wikipedia.org/wiki/YAML  
[30] Bản demo Grafana: https://play.grafana.org/  
