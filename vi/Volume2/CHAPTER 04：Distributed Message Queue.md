# Chương 4 Hàng đợi message phân tán

Trong chương này, chúng ta sẽ tìm hiểu một câu hỏi phổ biến trong phỏng vấn system design: thiết kế một hàng đợi message phân tán. Trong các kiến trúc hiện đại, hệ thống được tách thành những module nhỏ và độc lập, với interface được định nghĩa rõ ràng giữa các module. Hàng đợi message cung cấp khả năng giao tiếp và điều phối cho các module này. Vậy hàng đợi message mang lại những lợi ích gì?

- Giảm kết dính. Hàng đợi message loại bỏ sự kết dính chặt chẽ giữa các component, cho phép chúng được nâng cấp độc lập.

- Tăng khả năng mở rộng. Chúng ta có thể điều chỉnh quy mô của producer và consumer theo tải. Ví dụ, trong giờ cao điểm, có thể thêm consumer để xử lý lưu lượng tăng lên.

- Tăng availability. Nếu một phần của hệ thống ngừng hoạt động, các component khác vẫn có thể tương tác với queue.

- Hiệu năng tốt hơn. Sử dụng hàng đợi message giúp giao tiếp bất đồng bộ dễ dàng hơn. Producer có thể thêm message vào queue mà không cần chờ response. Consumer có thể tiêu thụ message khi sẵn sàng. Hai bên không cần chờ nhau.

Hình 4.1 giới thiệu một số hàng đợi message phân tán phổ biến nhất trên thị trường.

![Figure4.1.png](../../images/v2/chapter04/Figure4.1.png)

Hình 4.1: Các hàng đợi message phân tán phổ biến

### Hàng đợi message và nền tảng event streaming

Nói chính xác, Apache Kafka và Pulsar không phải là hàng đợi message mà là nền tảng event streaming. Tuy nhiên, một số tính năng tương tự đã làm mờ ranh giới giữa hàng đợi message (RocketMQ, ActiveMQ, RabbitMQ, ZeroMQ, v.v.) và nền tảng event streaming (Kafka, Pulsar). Ví dụ, RabbitMQ là một hàng đợi message điển hình, có một tính năng streaming tùy chọn cho phép tiêu thụ message lặp lại và lưu giữ message lâu dài. Tính năng này được triển khai bằng append-only log, giống như ở nền tảng event streaming. Apache Pulsar là đối thủ cạnh tranh chính của Kafka, nhưng nó cũng đủ linh hoạt và hiệu quả để được dùng như một hàng đợi message phân tán điển hình.

Trong chương này, chúng ta sẽ thiết kế một hàng đợi message phân tán có **các tính năng bổ sung (chẳng hạn lưu giữ message lâu dài, tiêu thụ message lặp lại, v.v.)**. Những tính năng này thường chỉ có ở nền tảng event streaming và khiến thiết kế phức tạp hơn. Vì vậy, trong suốt chương, chúng ta sẽ chỉ ra những phần có thể đơn giản hóa nếu cuộc phỏng vấn tập trung vào hàng đợi message phân tán truyền thống hơn.

## Bước 1 - Hiểu vấn đề và xác định phạm vi thiết kế

Nói ngắn gọn, chức năng cơ bản của hàng đợi message là: producer gửi message vào queue, consumer tiêu thụ message từ queue. Ngoài ra, chúng ta còn cần xem xét hiệu năng, semantics truyền message, việc lưu dữ liệu, v.v. Nhóm câu hỏi dưới đây giúp làm rõ yêu cầu và thu hẹp phạm vi thiết kế.

**Ứng viên**: Format và kích thước trung bình của message là bao nhiêu? Chỉ là text hay có cả multimedia?

**Người phỏng vấn**: Chỉ có message dạng text. Message thường có kích thước tính bằng (KBs).

**Ứng viên**: Message có thể được tiêu thụ lặp lại không?

**Người phỏng vấn**: Có, message có thể được các consumer khác nhau tiêu thụ lặp lại. Lưu ý đây là một tính năng bổ sung. Hàng đợi message phân tán truyền thống không giữ lại message sau khi message được chuyển thành công cho consumer. Vì vậy, trong hàng đợi message truyền thống, message không thể được tiêu thụ lặp lại.

**Ứng viên**: Message có cần được tiêu thụ theo thứ tự sản xuất không?

**Người phỏng vấn**: Có, message nên được tiêu thụ theo thứ tự sản xuất. Lưu ý đây là một tính năng bổ sung. Hàng đợi message phân tán truyền thống thường không đảm bảo thứ tự chuyển message.

**Ứng viên**: Dữ liệu có cần persistence không? Cần giữ lại trong bao lâu?

**Người phỏng vấn**: Có, chúng ta giả sử dữ liệu cần được giữ lại trong hai tuần. Lưu ý đây là một tính năng bổ sung. Hàng đợi message phân tán truyền thống không cần giữ lại message.

**Ứng viên**: Chúng ta cần hỗ trợ bao nhiêu producer và consumer?

**Người phỏng vấn**: Càng nhiều càng tốt.

**Ứng viên**: Chúng ta cần hỗ trợ semantics truyền dữ liệu nào? Ví dụ, nhiều nhất một lần, ít nhất một lần hay chính xác một lần.

**Người phỏng vấn**: Chắc chắn chúng ta cần hỗ trợ ít nhất một lần. Lý tưởng nhất là hỗ trợ tất cả các semantics này và cho phép cấu hình.

**Ứng viên**: Throughput mục tiêu và yêu cầu latency end-to-end là gì?

**Người phỏng vấn**: Hệ thống cần hỗ trợ throughput cao để đáp ứng các use case như tổng hợp log. Đồng thời, hệ thống cũng cần hỗ trợ latency thấp để đáp ứng các use case của hàng đợi message truyền thống.

Dựa trên cuộc trao đổi ở trên, chúng ta có thể giả định các yêu cầu chức năng sau:

- Producer gửi message vào hàng đợi message.
- Consumer tiêu thụ message từ hàng đợi message.
- Message có thể được tiêu thụ lặp lại hoặc chỉ một lần.
- Dữ liệu lịch sử có thể bị cắt bớt.
- Kích thước message nằm trong phạm vi kilobyte.
- Có thể chuyển message cho consumer theo thứ tự chúng được thêm vào queue.
- Người dùng có thể cấu hình semantics truyền dữ liệu (ít nhất một lần, nhiều nhất một lần hoặc chính xác một lần).

### Yêu cầu phi chức năng

- Throughput cao hoặc latency thấp, có thể cấu hình theo use case.
- Có khả năng mở rộng. Hệ thống phải có đặc tính phân tán và có thể hỗ trợ lượng message tăng đột biến.
- Bền vững. Dữ liệu phải được persistence trên disk và được replicate giữa nhiều node.

### Điều chỉnh cho hàng đợi message truyền thống

Các hàng đợi message truyền thống như RabbitMQ không có yêu cầu lưu giữ mạnh như nền tảng event streaming. Message chỉ được giữ trong memory đủ lâu để được tiêu thụ. Dung lượng tràn sang disk[1] mà chúng cung cấp nhỏ hơn vài bậc độ lớn so với dung lượng cần thiết cho nền tảng event streaming. Thông thường, chúng cũng không duy trì thứ tự message; thứ tự tiêu thụ message có thể khác thứ tự sản xuất. Những khác biệt này đơn giản hóa thiết kế rất nhiều, và chúng ta sẽ thảo luận ở những phần thích hợp.

## Bước 2 - Đề xuất thiết kế cấp cao và nhận được sự đồng thuận

Trước tiên, hãy thảo luận về chức năng cơ bản của hàng đợi message.

Hình 4.2 minh họa các component chính của hàng đợi message và tương tác đơn giản giữa các component.

![Figure4.2.png](../../images/v2/chapter04/Figure4.2.png)

Hình 4.2: Các component chính của hàng đợi message

- Producer gửi message vào queue.
- Consumer subscribe queue và tiêu thụ các message đã subscribe.
- Hàng đợi message là một service trung gian, decouple producer và consumer, cho phép mỗi bên chạy và mở rộng độc lập.
- Trong mô hình client/server, producer và consumer đều là client, còn hàng đợi message là server. Client và server giao tiếp qua network.

### Mô hình message

Hai mô hình message phổ biến nhất là point-to-point và publish-subscribe.

#### Point-to-point

Mô hình này thường gặp ở hàng đợi message truyền thống. Trong mô hình point-to-point, message được gửi vào queue chỉ có thể được một consumer tiêu thụ. Có thể có nhiều consumer chờ tiêu thụ message trong queue, nhưng mỗi message chỉ được một consumer tiêu thụ. Trong Hình 4.3, message A chỉ được consumer 1 tiêu thụ.

![Figure4.3.png](../../images/v2/chapter04/Figure4.3.png)

Hình 4.3: Mô hình point-to-point

Ngay khi consumer xác nhận message đã được tiêu thụ, message sẽ bị xóa khỏi queue. Trong mô hình point-to-point không có data retention. Ngược lại, thiết kế của chúng ta có một persistence layer lưu message trong hai tuần, cho phép message được tiêu thụ lặp lại.

Mặc dù thiết kế của chúng ta có thể mô phỏng mô hình point-to-point, chức năng của nó gần với mô hình publish-subscribe hơn.

#### Publish-subscribe

Trước tiên, chúng ta giới thiệu một khái niệm mới là topic. Topic là một phân loại dùng để tổ chức message. Trong toàn bộ message queue service, mỗi topic có một tên duy nhất.

Message được gửi đến một topic cụ thể và cũng có thể được đọc từ một topic cụ thể.

Trong mô hình publish-subscribe, message được gửi đến topic và được các consumer subscribe topic đó tiêu thụ. Như Hình 4.4 minh họa, message A được consumer 1 và consumer 2 cùng tiêu thụ.

![Figure4.4.png](../../images/v2/chapter04/Figure4.4.png)

Hình 4.4: Mô hình publish-subscribe

Hàng đợi message phân tán của chúng ta hỗ trợ cả hai mô hình. Mô hình publish-subscribe được triển khai qua **topic**, còn mô hình point-to-point có thể được mô phỏng bằng **consumer group**. Khái niệm consumer group sẽ được giới thiệu trong phần Consumer group.

### Topic, partition và broker

Như đã nói, message được persistence theo topic. Nếu lượng dữ liệu trong topic quá lớn và một server không thể xử lý thì sao?

Một cách giải quyết vấn đề này là **partition**. Như Hình 4.5 minh họa, chúng ta chia topic thành các partition và phân phối message đều giữa các partition. Có thể xem partition là một tập con nhỏ các message của topic. Các partition được phân phối đều trên các server trong cluster hàng đợi message. Các server lưu những partition này được gọi là **broker**. Việc phân phối partition trên các broker là yếu tố then chốt để hỗ trợ khả năng mở rộng cao. Chúng ta có thể mở rộng capacity của topic bằng cách tăng số lượng partition.

![Figure4.5.png](../../images/v2/chapter04/Figure4.5.png)

Hình 4.5: Partition

Mỗi partition của topic hoạt động như một queue FIFO (first in, first out). Điều này có nghĩa là chúng ta có thể duy trì thứ tự message trong partition. Vị trí của message trong partition được gọi là **offset**.

Producer gửi message, thực chất là gửi đến một partition của topic. Mỗi message có một message key tùy chọn (chẳng hạn user ID), và những message có cùng message key sẽ được gửi đến cùng một partition. Nếu không có message key, message sẽ được gửi ngẫu nhiên đến một partition.

Khi consumer subscribe một topic, nó pull dữ liệu từ một hoặc nhiều partition của topic đó. Khi có nhiều consumer subscribe một topic, mỗi consumer chịu trách nhiệm cho một phần partition của topic. Các consumer này tạo thành **consumer group** của topic.

Cluster hàng đợi message, bao gồm broker và partition, được minh họa trong Hình 4.6.

![Figure4.6.png](../../images/v2/chapter04/Figure4.6.png)

Hình 4.6: Cluster hàng đợi message

### Consumer group

Như đã nói, chúng ta cần hỗ trợ đồng thời mô hình point-to-point và publish-subscribe. **Consumer group** là một nhóm consumer cùng tiêu thụ message trong topic.

Consumer có thể được tổ chức thành các consumer group. Mỗi consumer group có thể subscribe nhiều topic và duy trì offset tiêu thụ riêng. Ví dụ, chúng ta có thể nhóm consumer theo use case: một group xử lý billing, group khác xử lý accounting.

Các consumer trong cùng một group có thể tiêu thụ song song, như Hình 4.7 minh họa.

- Consumer group 1 subscribe topic A.
- Consumer group 2 subscribe topic A và B.

- Topic A được consumer group 1 và 2 cùng subscribe, nghĩa là cùng một message sẽ được nhiều consumer tiêu thụ. Mô hình này hỗ trợ publish-subscribe.

![Figure4.7.png](../../images/v2/chapter04/Figure4.7.png)

Hình 4.7: Consumer group

Tuy nhiên, cách này có một vấn đề. Đọc dữ liệu song song làm tăng throughput nhưng không đảm bảo thứ tự tiêu thụ message trong cùng một partition. Ví dụ, nếu consumer 1 và consumer 2 cùng đọc dữ liệu từ partition 1, chúng ta không thể đảm bảo thứ tự tiêu thụ message trong partition 1.

Tin tốt là chúng ta có thể thêm một ràng buộc để giải quyết vấn đề này: một partition chỉ được một consumer trong cùng group tiêu thụ. Nếu số consumer trong consumer group lớn hơn số partition trong topic, một số consumer sẽ không thể lấy dữ liệu từ topic. Ví dụ, trong Hình 4.7, message trong topic B không thể được consumer 3 của consumer group 2 tiêu thụ vì nó đã được consumer 4 trong cùng consumer group tiêu thụ.

Với ràng buộc này, nếu đặt tất cả consumer vào cùng một consumer group, message trong cùng một partition chỉ được một consumer tiêu thụ, tương đương với mô hình point-to-point. Partition là đơn vị lưu trữ nhỏ nhất, vì vậy chúng ta có thể phân bổ đủ partition từ trước để tránh phải tăng số lượng partition động. Khi xử lý concurrency cao, chúng ta chỉ cần tăng số consumer.

### Kiến trúc cấp cao

Hình 4.8 minh họa thiết kế cấp cao đã cập nhật.

![Figure4.8.png](../../images/v2/chapter04/Figure4.8.png)

Hình 4.8: Thiết kế cấp cao

Client

- Producer: gửi message đến topic được chỉ định.
- Consumer group: subscribe topic và tiêu thụ message.

Core service và storage

- Broker: lưu nhiều partition. Một partition lưu một tập con message của topic.
- Storage:
  - Data storage: message được persistence trong data storage của partition.
  - State storage: trạng thái tiêu thụ được state storage quản lý.
  - Metadata storage: cấu hình và thuộc tính của topic được persistence trong metadata storage.

- Coordination service
  - Service discovery: những broker nào đang active.
  - Leader election: chọn một broker làm active controller. Trong cluster chỉ có một active controller, chịu trách nhiệm phân bổ partition.
  - Thường dùng Apache ZooKeeper[2] hoặc etcd[3] để bầu controller.

## Bước 3 - Thiết kế chi tiết

Để đạt throughput cao đồng thời đáp ứng yêu cầu data retention cao, chúng ta đã đưa ra ba lựa chọn thiết kế quan trọng. Bây giờ hãy giải thích chi tiết.

- Chúng ta chọn một data structure trên disk tận dụng khả năng sequential access xuất sắc của rotating disk và chiến lược disk cache tích cực của các hệ điều hành hiện đại.
- Chúng ta thiết kế data structure của message sao cho message có thể đi từ producer đến queue rồi đến consumer mà không cần sửa message. Điều này giảm tối đa nhu cầu copy. Trong các hệ thống có capacity và traffic cao, copy rất tốn kém.

- Chúng ta thiết kế hệ thống phù hợp với batch processing. I/O nhỏ cản trở throughput cao. Vì vậy, bất cứ khi nào có thể, thiết kế của chúng ta đều sử dụng batching. Producer gửi message theo batch. Hàng đợi message persistence message theo batch. Khi có thể, consumer cũng lấy message theo batch.

### Data storage

Bây giờ hãy tìm hiểu chi tiết hơn về việc persistence message. Để tìm ra lựa chọn tốt nhất, chúng ta hãy xem xét traffic pattern của hàng đợi message.

- Write-intensive và read-intensive.
- Không có thao tác update hoặc delete. Nhân tiện, hàng đợi message truyền thống không persistence message trừ khi message bị tụt lại phía sau. Khi queue bắt kịp, sẽ có thao tác delete. Phần chúng ta đang thảo luận là persistence của data streaming platform.
- Chủ yếu là sequential read/write.

Lựa chọn 1: Database

Lựa chọn đầu tiên là sử dụng database.

- Relational database: tạo một table cho topic và ghi message vào table dưới dạng row.
- NoSQL: tạo một collection làm topic và ghi message dưới dạng document.

Database có thể đáp ứng yêu cầu lưu trữ, nhưng không lý tưởng vì rất khó thiết kế một database hỗ trợ đồng thời access pattern write-intensive và read-intensive ở quy mô lớn. Giải pháp database không phù hợp với pattern sử dụng dữ liệu cụ thể của chúng ta.

Điều này có nghĩa database không phải lựa chọn tốt nhất và thậm chí có thể trở thành bottleneck của hệ thống.

Lựa chọn 2: Write-ahead log (WAL)

Lựa chọn thứ hai là write-ahead log (WAL). WAL chỉ là một file thông thường, trong đó entry mới được append vào append-only log. WAL được nhiều hệ thống sử dụng, chẳng hạn redo log[4] trong MySQL và WAL trong ZooKeeper.

Chúng ta đề xuất persistence message thành các file WAL log trên disk. WAL có access pattern hoàn toàn là sequential read/write. Hiệu năng sequential read/write của disk rất tốt[5]. Ngoài ra, rotating disk có capacity lớn và giá rẻ.

Như Hình 4.9 minh họa, message mới được append vào cuối partition và có offset tăng đơn điệu. Lựa chọn đơn giản nhất là dùng số dòng của log file làm offset. Tuy nhiên, file không thể tăng vô hạn, nên chia file thành các segment là một ý tưởng tốt.

Sau khi chia segment, message mới chỉ được append vào active segment file. Khi active segment đạt đến kích thước nhất định, một active segment mới sẽ được tạo để nhận message, còn active segment hiện tại trở thành inactive, giống như các segment inactive khác. Inactive segment chỉ xử lý request đọc. Nếu file inactive cũ vượt quá giới hạn retention hoặc capacity, nó có thể bị cắt bớt.

![Figure4.9.png](../../images/v2/chapter04/Figure4.9.png)

Hình 4.9: Append message mới

Các segment file của cùng một partition nằm trong một folder tên là Partition-{:partition_id}. Cấu trúc được minh họa trong Hình 4.10.

![Figure4.10.png](../../images/v2/chapter04/Figure4.10.png)

Hình 4.10: Phân bố các segment file dữ liệu trong partition của topic

#### Lưu ý về hiệu năng disk

Để đáp ứng yêu cầu data retention cao, thiết kế của chúng ta phụ thuộc nhiều vào disk để lưu lượng dữ liệu lớn. Có một hiểu lầm phổ biến rằng rotating disk chậm, nhưng trên thực tế nó chỉ chậm khi random access. Với workload của chúng ta, chỉ cần thiết kế data structure trên disk để tận dụng access pattern tuần tự, các disk trong cấu hình RAID hiện đại (tức là striping disk để tăng hiệu năng) có thể dễ dàng đạt tốc độ đọc ghi hàng trăm megabyte mỗi giây. Điều này dư sức đáp ứng yêu cầu của chúng ta, đồng thời cấu trúc chi phí cũng rất có lợi.

Ngoài ra, hệ điều hành hiện đại tích cực cache dữ liệu disk trong main memory, thậm chí sẵn sàng dùng toàn bộ free memory có sẵn để cache dữ liệu disk. Như đã nói ở trên, WAL cũng sử dụng nhiều disk cache của hệ điều hành.

### Data structure của message

Data structure của message là yếu tố then chốt để đạt throughput cao. Nó định nghĩa contract giữa producer, hàng đợi message và consumer. Thiết kế của chúng ta đạt hiệu năng cao bằng cách loại bỏ những lần copy dữ liệu không cần thiết trong quá trình truyền message từ producer đến queue rồi cuối cùng đến consumer. Nếu bất kỳ phần nào trong hệ thống không tuân theo contract này, message sẽ phải được biến đổi, kéo theo thao tác copy tốn kém và có thể ảnh hưởng nghiêm trọng đến hiệu năng hệ thống.

Dưới đây là schema mẫu của data structure message:

![Table4.1.png](../../images/v2/chapter04/Table4.1.png)

Bảng 4.1: Schema dữ liệu của message

#### Message key

Message key được dùng để xác định partition của message, theo công thức hash(key) % số partition. Nếu không được định nghĩa, partition sẽ được chọn ngẫu nhiên. Nếu cần linh hoạt hơn, producer có thể định nghĩa algorithm mapping riêng để chọn partition. Lưu ý key không giống partition number.

Key có thể là string hoặc number. Nó thường chứa một số thông tin nghiệp vụ. Partition number là khái niệm của hàng đợi message và không nên expose trực tiếp cho client.

Với algorithm mapping phù hợp, ngay cả khi số lượng partition thay đổi, message vẫn có thể được gửi đều đến tất cả partition.

#### Message value

Message value là payload của message. Nó có thể là text thuần hoặc binary block đã được nén.

|Lưu ý|
|:--|
|Key và value của message khác với cặp key-value trong KV storage. Trong key-value storage, key là duy nhất và chúng ta có thể tìm value tương ứng thông qua key. Trong message, key không cần duy nhất, thậm chí không bắt buộc phải có, và chúng ta cũng không cần tìm value thông qua key.| 

#### Các field khác của message

- Topic: tên topic mà message thuộc về.
- Partition: ID của partition mà message thuộc về.
- Offset: vị trí của message trong partition. Chúng ta có thể tìm một message bằng tổ hợp ba field: topic, partition, offset.
- Timestamp: timestamp tại thời điểm message được lưu trữ.
- Size: kích thước của message.
- CRC: cyclic redundancy check (CRC) dùng để đảm bảo tính toàn vẹn của dữ liệu gốc.

Để hỗ trợ các tính năng bổ sung, có thể thêm các field tùy chọn theo nhu cầu. Ví dụ, nếu tag là một phần của các field tùy chọn, có thể filter message theo tag.

### Batch processing

Batch processing xuất hiện rất phổ biến trong thiết kế này. Chúng ta batch message ở producer, consumer và chính hàng đợi message. Batching là yếu tố then chốt của hiệu năng hệ thống. Trong phần này, chúng ta chủ yếu tập trung vào batching trong hàng đợi message. Sau đó, chúng ta sẽ thảo luận chi tiết hơn về batching ở producer và consumer.

Batching là chìa khóa để tăng hiệu năng vì:

- Nó cho phép hệ điều hành nhóm các message lại, xử lý chúng trong một network request duy nhất và phân bổ chi phí round trip network tốn kém.
- Khi broker ghi một batch message lớn vào append-only log, các log này sẽ được nạp vào những block sequential write lớn hơn do hệ điều hành duy trì và những block disk cache liên tục lớn hơn. Cả hai đều làm tăng đáng kể throughput của sequential disk access.

Cần có sự đánh đổi giữa throughput và latency. Nếu hệ thống được triển khai như một hàng đợi message truyền thống, latency quan trọng hơn, và có thể điều chỉnh hệ thống để dùng batch size nhỏ hơn. Trong trường hợp này, hiệu năng disk sẽ bị ảnh hưởng một chút. Nếu tối ưu cho throughput, mỗi topic có thể cần nhiều partition hơn để bù cho throughput sequential disk write chậm hơn.

Đến đây, chúng ta đã giới thiệu disk storage subsystem chính và data structure trên disk liên quan. Bây giờ hãy chuyển chủ đề để thảo luận về flow của producer và consumer. Sau đó, chúng ta sẽ quay lại tìm hiểu sâu hơn các phần còn lại của hàng đợi message.

### Flow của producer

Nếu producer muốn gửi message đến một partition, nó nên kết nối đến broker nào? Lựa chọn đầu tiên là đưa vào một routing layer. Mọi message gửi đến routing layer sẽ được route đến broker “đúng”. Nếu broker có replica, broker “đúng” là leader replica. Chúng ta sẽ giới thiệu replication sau.

![Figure4.11.png](../../images/v2/chapter04/Figure4.11.png)

Hình 4.11: Routing layer

Như Hình 4.11 minh họa, producer cố gắng gửi message đến partition-1 của topic-A.

1. Producer gửi message đến routing layer.
2. Routing layer đọc replica distribution plan<sup>1</sup> từ metadata storage và cache plan ở local. Khi message đến, nó route message đến leader replica của partition-1 được lưu trên broker-1.

> Chú thích 1: Phân bố replica của mỗi partition được gọi là replica distribution plan.

3. Leader replica nhận message, follower replica pull dữ liệu từ leader replica.
4. Khi “đủ nhiều” replica đã synchronize message, leader replica commit dữ liệu (lưu trên disk), để dữ liệu có thể được tiêu thụ. Sau đó, nó response cho producer.

Có thể bạn thắc mắc tại sao chúng ta cần leader replica và follower replica. Lý do là fault tolerance. Chúng ta sẽ tìm hiểu sâu hơn quá trình này trong phần “In-sync replica” ở trang 113.

Cách này hoạt động được, nhưng có một số nhược điểm:

- Routing layer mới tạo ra overhead và thêm network hop, dẫn đến network latency bổ sung.
- Batch request là yếu tố quan trọng để tăng hiệu quả. Thiết kế này chưa cân nhắc điều đó.

Hình 4.12 minh họa thiết kế được cải tiến.

![Figure4.12.png](../../images/v2/chapter04/Figure4.12.png)

Hình 4.12: Producer có buffer và routing

Routing layer được đóng gói vào producer, đồng thời thêm một buffering component vào producer. Cả hai có thể được cài đặt trong producer như một phần của producer client library. Thay đổi này mang lại một số lợi ích:

- Ít network hop hơn, latency thấp hơn.
- Producer có thể có logic riêng để quyết định message nên được gửi đến partition nào.
- Batching cache message trong memory, cho phép gửi một batch message lớn hơn trong một request duy nhất. Điều này làm tăng throughput.

Việc chọn batch size là sự đánh đổi kinh điển giữa throughput và latency (Hình 4.13). Batch lớn làm throughput tăng nhưng latency cao hơn vì cần chờ lâu hơn để tích lũy batch. Batch nhỏ được gửi request nhanh hơn nên latency thấp hơn, nhưng throughput bị ảnh hưởng. Producer có thể điều chỉnh batch size theo use case.

![Figure4.13.png](../../images/v2/chapter04/Figure4.13.png)

### Flow của consumer

Consumer chỉ định offset trong partition và bắt đầu nhận event từ vị trí đó. Như Hình 4.14 minh họa.

![Figure4.14.png](../../images/v2/chapter04/Figure4.14.png)

Hình 4.14: Flow tiêu thụ

#### Push và pull

Hãy trả lời một câu hỏi quan trọng: broker nên push dữ liệu đến consumer hay consumer nên pull dữ liệu từ broker?

##### Mô hình push

Ưu điểm:

- Latency thấp: broker có thể push message đến consumer ngay sau khi nhận message.

Nhược điểm:

- Nếu tốc độ tiêu thụ thấp hơn tốc độ sản xuất, consumer có thể bị quá tải.
- Tốc độ truyền dữ liệu do broker kiểm soát, rất khó thay đổi theo khả năng xử lý khác nhau của từng consumer.

##### Mô hình pull

Ưu điểm:

- Consumer kiểm soát tốc độ tiêu thụ. Chúng ta có thể cho một nhóm consumer xử lý message theo thời gian thực và nhóm khác xử lý message theo batch.
- Nếu tốc độ tiêu thụ thấp hơn tốc độ sản xuất, chúng ta có thể thêm consumer hoặc xử lý từ từ.
- Mô hình pull phù hợp hơn với batch processing. Trong mô hình push, broker không biết consumer có thể xử lý message ngay hay không. Nếu broker gửi từng message một đến consumer mà consumer xử lý không kịp, message mới sẽ chờ trong buffer. Mô hình pull sẽ pull tất cả message có sẵn sau vị trí hiện tại của consumer trong log (hoặc pull đến max size được cấu hình), phù hợp với việc xử lý dữ liệu theo batch lớn.

Nhược điểm:

- Khi broker không có message, consumer vẫn tiếp tục pull dữ liệu, gây lãng phí resource. Để giải quyết vấn đề này, nhiều hàng đợi message hỗ trợ long polling, cho phép pull chờ trong một khoảng thời gian được chỉ định để lấy message mới[6].

Dựa trên những cân nhắc này, phần lớn hàng đợi message chọn mô hình pull.

Hình 4.15 minh họa workflow của mô hình pull ở consumer.

![Figure4.15.png](../../images/v2/chapter04/Figure4.15.png)

Hình 4.15: Mô hình pull

1. Consumer mới muốn tham gia consumer group 1 và subscribe topic A. Nó tìm broker tương ứng bằng hash của group name. Nhờ đó, tất cả consumer trong cùng một consumer group kết nối đến cùng một broker. Broker này cũng được gọi là coordinator của consumer group. Dù tên gọi tương tự, coordinator của consumer group khác với coordination service được đề cập trong Hình 4.8. Coordinator này điều phối consumer group, còn coordination service ở trên điều phối broker cluster.
2. Coordinator xác nhận consumer đã tham gia consumer group và assign partition 2 cho consumer. Có nhiều strategy assign partition, bao gồm round-robin, range, v.v.[7]
3. Consumer lấy message bắt đầu từ offset được tiêu thụ gần nhất, offset này do state storage quản lý.
4. Consumer xử lý message và commit offset cho broker. Thứ tự xử lý message và commit offset ảnh hưởng đến semantics truyền message; chúng ta sẽ thảo luận sau.

### Consumer rebalance

Consumer rebalance quyết định consumer nào chịu trách nhiệm cho subset partition nào. Quá trình này có thể xảy ra khi consumer tham gia, rời đi, crash hoặc khi partition được điều chỉnh.

Khi consumer rebalance xảy ra, coordinator đóng vai trò quan trọng. Trước tiên hãy xem coordinator là gì. Coordinator là một broker chịu trách nhiệm giao tiếp với consumer để thực hiện consumer rebalance. Coordinator nhận heartbeat từ consumer và quản lý offset của chúng trên partition.

Hãy dùng một ví dụ để hiểu cách coordinator và consumer phối hợp với nhau.

![Figure4.16.png](../../images/v2/chapter04/Figure4.16.png)

Hình 4.16: Coordinator của consumer group

- Như Hình 4.16 minh họa, mỗi consumer thuộc về một consumer group. Nó tìm coordinator được chỉ định bằng hash của group name. Tất cả consumer thuộc cùng một consumer group đều kết nối đến cùng một coordinator.
- Coordinator duy trì danh sách consumer đã tham gia. Khi danh sách thay đổi, coordinator sẽ bầu một leader mới trong group.
- Consumer leader của consumer group tạo partition assignment plan mới và báo cáo cho coordinator. Coordinator broadcast plan cho các consumer khác trong group.

Trong hệ thống phân tán, consumer có thể gặp nhiều vấn đề như lỗi network, crash, restart, v.v. Từ góc nhìn của coordinator, chúng sẽ không còn heartbeat. Khi điều này xảy ra, coordinator trigger rebalance để phân bổ lại partition, như Hình 4.17 minh họa.

![Figure4.17.png](../../images/v2/chapter04/Figure4.17.png)

Hình 4.17: Consumer rebalance

Hãy mô phỏng một số scenario rebalance. Giả sử consumer group có hai consumer và topic được subscribe có 4 partition. Hình 4.18 minh họa quy trình consumer B mới tham gia consumer group.

![Figure4.18.png](../../images/v2/chapter04/Figure4.18.png)

Hình 4.18: Consumer mới tham gia

1. Ban đầu, consumer group chỉ có consumer A. Nó tiêu thụ tất cả partition và duy trì heartbeat với coordinator.
2. Consumer B gửi request tham gia consumer group.
3. Coordinator biết đã đến lúc rebalance, nên thông báo một cách bị động cho tất cả consumer trong group. Khi coordinator nhận heartbeat của A, nó yêu cầu A tham gia lại consumer group.
4. Khi tất cả consumer đã tham gia lại consumer group, coordinator chọn một consumer làm leader và thông báo kết quả bầu cử cho tất cả consumer.
5. Consumer leader tạo partition assignment plan và gửi plan đến coordinator. Consumer follower hỏi coordinator về partition assignment plan.
6. Consumer bắt đầu tiêu thụ message từ các partition mới được phân bổ.

Hình 4.19 minh họa quy trình consumer A rời consumer group.

![Figure4.19.png](../../images/v2/chapter04/Figure4.19.png)

Hình 4.19: Consumer hiện tại rời đi

1. Consumer A và B thuộc cùng một consumer group.
2. Consumer A cần được shutdown nên gửi request rời consumer group.
3. Coordinator biết đã đến lúc rebalance. Khi coordinator nhận heartbeat của B, nó yêu cầu B tham gia lại consumer group.
4. Các bước còn lại giống như trong Hình 4.18.

Hình 4.20 minh họa quy trình khi consumer A hiện tại crash.

![Figure4.20.png](../../images/v2/chapter04/Figure4.20.png)

Hình 4.20: Consumer hiện tại crash

1. Consumer A và B duy trì heartbeat với coordinator.
2. Consumer A crash, nên không còn heartbeat nào được gửi từ consumer A đến coordinator. Khi coordinator không nhận được heartbeat nào từ consumer A trong khoảng thời gian được chỉ định, nó đánh dấu consumer A là dead.
3. Coordinator trigger rebalance.
4. Các bước còn lại giống scenario trước.

Đến đây chúng ta đã thảo luận xong flow của producer và consumer. Bây giờ hãy quay lại tiếp tục tìm hiểu sâu hơn các phần còn lại của broker trong hàng đợi message.

### State storage

Trong broker của hàng đợi message, state storage lưu các nội dung sau:

- Mapping giữa partition và consumer.
- Offset được consumer group tiêu thụ gần nhất trong mỗi partition. Như Hình 4.21 minh họa, offset tiêu thụ gần nhất của consumer group 1 là 6, còn của consumer group 2 là 13.

![Figure4.21.png](../../images/v2/chapter04/Figure4.21.png)

Hình 4.21: Offset tiêu thụ gần nhất của consumer group

Ví dụ, như Hình 4.21 minh họa, consumer trong consumer group 1 tiêu thụ tuần tự các message trong partition và commit offset 6. Điều này có nghĩa tất cả message tại offset 6 và trước đó đã được tiêu thụ. Nếu consumer này crash, một consumer mới khác trong cùng group sẽ đọc offset tiêu thụ gần nhất từ state storage rồi tiếp tục tiêu thụ.

Access pattern của dữ liệu state consumer là:

- Thao tác read/write thường xuyên, nhưng lượng dữ liệu không lớn.
- Dữ liệu được update thường xuyên và hiếm khi bị delete.
- Random read/write.
- Data consistency rất quan trọng.

Có nhiều storage solution có thể dùng để lưu dữ liệu state của consumer. Xét đến yêu cầu consistency và read/write nhanh, KV storage như ZooKeeper là một lựa chọn tốt. Kafka đã migrate nơi lưu offset từ ZooKeeper sang Kafka broker. Bạn đọc quan tâm có thể đọc tài liệu tham khảo[8] để biết thêm.

### Metadata storage

Metadata storage lưu cấu hình và thuộc tính của topic, bao gồm số lượng partition, retention period và replica distribution.

Metadata không thường xuyên thay đổi, lượng dữ liệu nhỏ nhưng yêu cầu consistency cao. ZooKeeper là lựa chọn tốt để lưu metadata.

### ZooKeeper

Qua việc đọc các chương trước, có lẽ bạn đã cảm nhận ZooKeeper rất hữu ích cho việc thiết kế hàng đợi message phân tán. Nếu chưa quen thuộc, ZooKeeper là một basic service cung cấp hierarchical key-value storage cho hệ thống phân tán. Nó thường được dùng cho distributed configuration service, synchronization service và naming registry[2].

Như Hình 4.22 minh họa, ZooKeeper giúp đơn giản hóa thiết kế của chúng ta.

![Figure4.22.png](../../images/v2/chapter04/Figure4.22.png)

Hình 4.22: ZooKeeper

Hãy cùng ôn lại ngắn gọn các thay đổi.

- Metadata và state storage được migrate sang ZooKeeper.
- Broker giờ chỉ cần duy trì data storage của message.
- ZooKeeper giúp broker cluster thực hiện leader election.

### Replication

Trong hệ thống phân tán, vấn đề phần cứng thường xuyên xảy ra và không thể bỏ qua. Khi disk hỏng hoặc hỏng vĩnh viễn, dữ liệu sẽ mất. Replication là giải pháp kinh điển để đạt availability cao.

Như Hình 4.23 minh họa, mỗi partition có 3 replica được phân bố trên các broker node khác nhau.

Với mỗi partition, replica được highlight là leader replica, các replica còn lại là follower replica. Producer chỉ gửi message đến leader replica. Follower replica liên tục pull message mới từ leader replica. Khi message được synchronize đến đủ số replica, leader replica trả acknowledgement cho producer. Chúng ta sẽ giới thiệu chi tiết cách định nghĩa “đủ” trong phần In-sync replica dưới đây.

![Figure4.23.png](../../images/v2/chapter04/Figure4.23.png)

Hình 4.23: Replication

Phân bố replica của mỗi partition được gọi là replica distribution plan. Ví dụ, replica distribution plan trong Hình 4.23 có thể mô tả như sau:

- Partition 1 của topic A: 3 replica, leader replica ở broker 1, follower replica ở broker 2 và 3;
- Partition 2 của topic A: 3 replica, leader replica ở broker 2, follower replica ở broker 3 và 4;
- Partition 1 của topic B: 3 replica, leader replica ở broker 3, follower replica ở broker 4 và 1.

Ai tạo replica distribution plan? Cách hoạt động như sau: với sự hỗ trợ của coordinator, một broker được bầu làm leader. Broker này tạo replica distribution plan và persistence plan trong metadata storage. Sau đó, tất cả broker có thể làm việc theo plan.

Nếu muốn tìm hiểu thêm về replication, hãy xem chương “Replication” trong cuốn *Designing Data-Intensive Applications*[9].

#### In-sync replica

Chúng ta đã đề cập message được persistence trên nhiều partition để tránh lỗi single node, và mỗi partition có nhiều replica. Message chỉ được ghi vào leader replica, còn follower replica synchronize dữ liệu từ leader replica. Một vấn đề cần giải quyết là duy trì trạng thái synchronize của chúng.

In-sync replica (ISR) là các replica “synchronize” với leader replica. Định nghĩa “synchronize” phụ thuộc vào cấu hình topic. Ví dụ, nếu giá trị của replica.lag.max.messages là 4, thì miễn follower replica không chậm hơn leader replica quá 3 message, nó sẽ không bị xóa khỏi ISR[10]. Theo mặc định, leader replica nằm trong ISR.

Hãy dùng ví dụ trong Hình 4.24 để minh họa cách ISR hoạt động.

- Offset đã commit trong leader replica là 13. Có hai message mới được ghi vào leader replica nhưng chưa commit. Committed offset biểu thị offset đó và tất cả message trước đó đã được synchronize đến mọi replica trong ISR.
- Replica 2 và replica 3 đã hoàn toàn bắt kịp leader replica, nên chúng nằm trong ISR và có thể lấy message mới.
- Replica 4 chưa hoàn toàn bắt kịp leader replica trong thời gian lag được cấu hình, nên không nằm trong ISR. Khi bắt kịp lại, nó có thể được thêm vào ISR.

![Figure4.24.png](../../images/v2/chapter04/Figure4.24.png)

Hình 4.24: Cách ISR hoạt động

Tại sao chúng ta cần ISR? Lý do là ISR phản ánh sự đánh đổi giữa performance và reliability. Nếu producer không muốn mất bất kỳ message nào, cách an toàn nhất là đảm bảo tất cả replica đã synchronize trước khi gửi acknowledgement. Nhưng replica chậm sẽ khiến toàn bộ partition chậm hoặc unavailable.

Sau khi đã thảo luận về ISR, hãy xem các acknowledgement setting. Producer có thể chọn chỉ nhận acknowledgement sau khi K ISR đã nhận message, trong đó K có thể cấu hình.

##### ACK=all

Hình 4.25 minh họa trường hợp ACK=all. Khi ACK=all, producer chỉ nhận ACK khi tất cả ISR đã nhận message. Điều này có nghĩa gửi message mất nhiều thời gian vì phải chờ ISR chậm nhất, nhưng cung cấp reliability message mạnh nhất.

![Figure4.25.png](../../images/v2/chapter04/Figure4.25.png)

Hình 4.25: ack=all

##### ACK=1

Khi ACK=1, producer nhận ACK ngay sau khi leader replica persistence xong message. Không chờ data synchronization giúp cải thiện latency. Nếu leader replica gặp lỗi ngay sau khi message được ACK, trong khi message chưa được replicate đến follower node, message sẽ bị mất. Setting này phù hợp với hệ thống latency thấp chấp nhận mất dữ liệu đôi khi.

![Figure4.26.png](../../images/v2/chapter04/Figure4.26.png)

Hình 4.26: ack=1

##### ACK=0

Producer liên tục gửi message đến leader replica, không chờ acknowledgement nào và không bao giờ retry. Cách này cung cấp latency thấp nhất, đánh đổi bằng khả năng mất message. Setting này có thể phù hợp với các use case như thu thập metric hoặc log, vì lượng dữ liệu lớn và có thể chấp nhận mất dữ liệu đôi khi.

![Figure4.27.png](../../images/v2/chapter04/Figure4.27.png)

Hình 4.27: ack=0

ACK có thể cấu hình cho phép chúng ta đổi reliability lấy performance.

Bây giờ hãy xem phía consumer. Setting đơn giản nhất là cho consumer kết nối đến leader replica để tiêu thụ message.

Có thể bạn thắc mắc thiết kế này có khiến leader replica bị quá tải không và tại sao không đọc message từ ISR. Lý do là:

- Thiết kế và vận hành đơn giản.
- Message trong một partition chỉ được assign cho một consumer trong một consumer group, điều này giới hạn số connection đến leader replica.
- Miễn topic không quá hot, số connection đến leader replica thường không lớn.
- Nếu topic hot, chúng ta có thể scale bằng cách tăng số partition và consumer.

Trong một số trường hợp, đọc từ leader replica có thể không phải lựa chọn tốt nhất. Ví dụ, nếu consumer nằm ở data center khác với leader replica, hiệu năng đọc sẽ bị ảnh hưởng. Trong trường hợp này, việc cho phép consumer đọc từ ISR gần nhất có giá trị. Bạn đọc quan tâm có thể xem tài liệu tham khảo liên quan[11].

ISR rất quan trọng. Làm thế nào xác định một replica có thuộc ISR hay không? Thông thường, leader replica của mỗi partition theo dõi danh sách ISR bằng cách tính lag của từng replica so với chính nó. Nếu quan tâm đến algorithm chi tiết, có thể xem implementation trong tài liệu tham khảo[12] [13].

### Khả năng mở rộng

Đến đây, chúng ta đã đạt được nhiều tiến triển trong việc thiết kế hệ thống hàng đợi message phân tán. Bước tiếp theo là đánh giá khả năng mở rộng của các system component khác nhau:

- Producer
- Consumer
- Broker
- Partition

#### Producer

Producer đơn giản hơn consumer rất nhiều về mặt khái niệm vì không cần group coordination. Có thể dễ dàng scale producer bằng cách thêm hoặc xóa producer instance.

#### Consumer

Các consumer group được isolate với nhau, nên dễ dàng thêm hoặc xóa consumer group. Trong consumer group, cơ chế rebalance giúp xử lý trường hợp consumer được thêm, xóa hoặc crash. Với consumer group và rebalance, có thể đạt khả năng mở rộng và fault tolerance cho consumer.

#### Broker

Trước khi thảo luận khả năng mở rộng của broker, hãy xem xét recovery khi broker gặp lỗi.

![Figure4.28.png](../../images/v2/chapter04/Figure4.28.png)

Hình 4.28: Broker node crash

Hãy dùng ví dụ trong Hình 4.28 để giải thích cách fault recovery hoạt động.

1. Giả sử có 4 broker, replica distribution plan của partition như sau:
   1. Partition 1 của topic A: replica ở broker 1 (leader replica), 2 và 3.
   2. Partition 2 của topic A: replica ở broker 2 (leader replica), 3 và 4.
   3. Partition 1 của topic B: replica ở broker 3 (leader replica), 4 và 1.

2. Broker 3 crash, nghĩa là tất cả partition trên node này bị mất. Replica distribution plan thay đổi thành:
   1. Partition 1 của topic A: replica ở broker 1 (leader replica) và 2.
   2. Partition 2 của topic A: replica ở broker 2 (leader replica) và 4.
   3. Partition 1 của topic B: replica ở broker 4 và 1.
3. Broker controller phát hiện broker 3 down và tạo replica distribution plan mới cho các broker node còn lại:
   1. Partition 1 của topic A: replica ở broker 1 (leader replica), 2 và 4 (replica mới).
   2. Partition 2 của topic A: replica ở broker 2 (leader replica), 4 và 1 (replica mới).
   3. Partition 1 của topic B: replica ở broker 4 (leader replica), 1 và 2 (replica mới).
4. Replica mới hoạt động như follower replica và bắt kịp leader replica.

Để broker có fault tolerance, cũng cần lưu ý những điểm sau:

- Số ISR tối thiểu chỉ định số replica mà producer phải nhận được trước khi message được xem là commit thành công. Số lượng càng lớn càng an toàn. Tuy nhiên, mặt khác, cần cân bằng latency và safety.
- Nếu tất cả replica của một partition nằm trên cùng một broker node, chúng ta không thể chịu lỗi của node đó. Hơn nữa, replicate dữ liệu trong cùng một node là lãng phí resource. Vì vậy, replica không nên nằm trên cùng một node.
- Nếu tất cả replica của một partition đều crash, message của partition đó sẽ mất vĩnh viễn. Khi chọn số lượng và vị trí replica, cần cân bằng giữa data safety, resource cost và latency. Phân tán replica trên các data center khác nhau an toàn hơn, nhưng tạo thêm latency và cost khi synchronize dữ liệu giữa các replica. Một giải pháp là data mirroring, có thể giúp replicate dữ liệu giữa các data center, nhưng nằm ngoài phạm vi cuốn sách. Tài liệu tham khảo[14] trình bày chủ đề này.

Bây giờ hãy quay lại thảo luận khả năng mở rộng của broker. Cách đơn giản nhất là reassign replica khi thêm hoặc xóa broker.

Tuy nhiên, có một cách tốt hơn. Broker controller có thể tạm thời cho phép số replica trong hệ thống nhiều hơn số được cấu hình trong configuration file. Khi broker mới thêm vào bắt kịp, chúng ta sẽ xóa replica không còn cần thiết. Hãy dùng ví dụ trong Hình 4.29 để hiểu cách này.

![Figure4.29.png](../../images/v2/chapter04/Figure4.29.png)

Hình 4.29: Thêm broker node mới

1. Thiết lập ban đầu: 3 broker, 2 partition, mỗi partition có 3 replica.
2. Thêm broker 4. Giả sử broker controller đổi replica distribution của partition 2 thành broker (2, 3, 4). Replica mới ở broker 4 bắt đầu replicate dữ liệu từ leader replica ở broker 2. Lúc này số replica của partition 2 tạm thời lớn hơn 3.
3. Đợi replica ở broker 4 bắt kịp, sau đó replica dư thừa ở broker 1 được xóa một cách trơn tru.

Thực hiện quy trình này giúp tránh mất dữ liệu khi thêm broker. Cũng có thể dùng cách tương tự để xóa broker an toàn.

#### Partition

Vì nhiều lý do vận hành, chẳng hạn mở rộng topic, tối ưu throughput, cân bằng availability/throughput, chúng ta có thể thay đổi số lượng partition. Khi số partition thay đổi, producer sẽ được thông báo sau khi giao tiếp với bất kỳ broker nào, và consumer cũng trigger consumer rebalance. Vì vậy, thao tác này an toàn cho cả producer và consumer.

Bây giờ hãy xem xét data storage layer khi số partition thay đổi. Như Hình 4.30 minh họa, chúng ta thêm một partition vào topic.

![Figure4.30.png](../../images/v2/chapter04/Figure4.30.png)

Hình 4.30: Thêm partition

- Message đã persistence vẫn nằm trong partition cũ, nên không cần migrate dữ liệu.
- Sau khi thêm partition mới (partition 3), message mới sẽ được persistence trên ba partition này.

Vì vậy, scale topic bằng cách thêm partition là cách đơn giản và trực tiếp nhất.

#### Giảm số partition

Giảm số partition phức tạp hơn, như Hình 4.31 minh họa.

![Figure4.31.png](../../images/v2/chapter04/Figure4.31.png)

Hình 4.31: Giảm partition

- Partition 3 đã offline, nên message mới chỉ có thể được nhận bởi các partition còn lại (partition 1 và partition 2).

- Partition đã offline không thể bị xóa ngay vì consumer có thể vẫn đang tiêu thụ dữ liệu trong đó. Chỉ sau retention period được cấu hình, dữ liệu mới có thể bị cắt bớt để giải phóng storage. Giảm partition không phải là một shortcut để thu hồi data space.
- Trong giai đoạn chuyển tiếp này (partition 3 đã offline), producer chỉ gửi message đến 2 partition còn lại, nhưng consumer vẫn có thể tiêu thụ từ 3 partition. Sau khi retention period của partition offline kết thúc, cần rebalance consumer group.

### Semantics truyền dữ liệu

Đến đây chúng ta đã hiểu các component khác nhau của hàng đợi message phân tán. Hãy tiếp tục thảo luận các semantics truyền dữ liệu khác nhau: nhiều nhất một lần, ít nhất một lần và chính xác một lần.

#### Nhiều nhất một lần

Đúng như tên gọi, nhiều nhất một lần nghĩa là message được chuyển nhiều nhất một lần. Message có thể bị mất nhưng không bị chuyển lặp lại. Đây là cách hoạt động ở mức cao của việc chuyển message nhiều nhất một lần.

- Producer bất đồng bộ gửi message đến topic mà không chờ acknowledgement (ack=0). Nếu gửi message thất bại, producer không retry.
- Consumer lấy message và commit offset trước khi xử lý xong dữ liệu. Nếu consumer crash sau khi commit offset, message sẽ không được tiêu thụ lại.

![Figure4.32.png](../../images/v2/chapter04/Figure4.32.png)

Hình 4.32: Nhiều nhất một lần

Cách này phù hợp với các use case chấp nhận mất một lượng nhỏ dữ liệu, chẳng hạn metric monitoring.

#### Ít nhất một lần

Với semantics truyền dữ liệu này, message có thể được chuyển nhiều lần nhưng không bị mất. Dưới đây là cách hoạt động ở mức cao.

- Producer gửi message đồng bộ hoặc bất đồng bộ thông qua response callback và đặt ack=1 hoặc ack=all để đảm bảo message được gửi đến broker. Nếu gửi message thất bại hoặc timeout, producer liên tục retry.
- Sau khi consumer lấy message, nó chỉ commit offset sau khi dữ liệu được xử lý thành công. Nếu xử lý message thất bại, consumer sẽ tiêu thụ lại message để không mất dữ liệu. Mặt khác, nếu consumer đã xử lý message nhưng không commit được offset cho broker, khi consumer khởi động lại, message sẽ được tiêu thụ lại, dẫn đến duplicate.
- Message có thể được chuyển đến broker và consumer nhiều lần.

![Figure4.33.png](../../images/v2/chapter04/Figure4.33.png)

Hình 4.33: Ít nhất một lần

Use case: semantics ít nhất một lần không làm mất message, nhưng cùng một message có thể được chuyển nhiều lần. Mặc dù không lý tưởng từ góc nhìn người dùng, semantics ít nhất một lần rất phù hợp với những trường hợp duplicate không phải vấn đề lớn hoặc có thể deduplicate ở phía consumer. Ví dụ, mỗi message có một unique key; khi ghi dữ liệu trùng lặp vào database, message sẽ bị từ chối.

#### Chính xác một lần

Chính xác một lần là semantics truyền dữ liệu khó triển khai nhất. Nó thân thiện với người dùng nhưng phải trả giá rất cao về performance và complexity của hệ thống.

![Figure4.34.png](../../images/v2/chapter04/Figure4.34.png)

Hình 4.34: Chính xác một lần

Use case: các trường hợp liên quan đến tài chính (payment, transaction, accounting, v.v.). Chính xác một lần đặc biệt quan trọng khi không cho phép duplicate và downstream service hoặc bên thứ ba không hỗ trợ idempotency.

### Tính năng nâng cao

Trong phần này, chúng ta sẽ thảo luận ngắn gọn một số tính năng nâng cao như message filtering, delayed message và scheduled message.

#### Message filtering

Topic là một abstraction logic chứa các message cùng loại. Tuy nhiên, một số consumer có thể chỉ muốn tiêu thụ một số subtype message. Ví dụ, order system gửi tất cả activity liên quan đến order vào cùng một topic, nhưng payment system chỉ quan tâm đến message liên quan đến checkout và refund.

Một lựa chọn là tạo topic riêng cho payment system và order system. Cách này đơn giản nhưng có thể dẫn đến một số vấn đề.

- Nếu các system khác cần những subtype message khác thì sao? Chúng ta có cần tạo một topic riêng cho mỗi consumer request không?
- Lưu cùng một message trên các topic khác nhau là lãng phí resource.
- Mỗi khi có yêu cầu consumer mới, producer lại cần thay đổi vì producer và consumer hiện bị tightly coupled.

Vì vậy, chúng ta cần một cách khác để giải quyết yêu cầu này. May mắn là message filtering có thể giải quyết vấn đề.

Một giải pháp message filtering đơn giản là consumer lấy toàn bộ message rồi filter các message không cần khi xử lý. Cách này linh hoạt nhưng tạo traffic không cần thiết và ảnh hưởng đến performance hệ thống.

Giải pháp tốt hơn là filter message ở phía broker, để consumer chỉ cần nhận các message mà nó quan tâm. Việc triển khai giải pháp này cần được cân nhắc cẩn thận. Nếu filter dữ liệu yêu cầu decrypt hoặc deserialize dữ liệu, performance của broker sẽ giảm. Ngoài ra, nếu message chứa dữ liệu nhạy cảm thì chúng không nên được đọc trong hàng đợi message.

Vì vậy, logic filter trong broker không nên extract payload của message. Tốt hơn là đặt dữ liệu dùng để filter vào metadata của message để broker có thể đọc hiệu quả. Ví dụ, chúng ta có thể thêm một tag vào mỗi message. Broker có thể filter message theo tag. Nếu thêm nhiều tag, message có thể được filter theo nhiều dimension. Vì vậy, danh sách tag có thể đáp ứng phần lớn nhu cầu filter. Để hỗ trợ logic phức tạp hơn, chẳng hạn công thức toán học, broker sẽ cần parser hoặc script executor, có thể quá nặng đối với hàng đợi message.

Bằng cách thêm tag vào mỗi message, consumer có thể subscribe message theo tag được chỉ định, như Hình 4.35 minh họa. Bạn đọc quan tâm có thể xem tài liệu tham khảo[15].

![Figure4.35.png](../../images/v2/chapter04/Figure4.35.png)

Hình 4.35: Filter message theo tag

#### Delayed message và scheduled message

Đôi khi bạn muốn trì hoãn một khoảng thời gian nhất định trước khi chuyển message cho consumer. Ví dụ, nếu order chưa được thanh toán trong vòng 30 phút sau khi tạo, order đó cần được đóng. Delayed validation message (kiểm tra payment đã hoàn tất hay chưa) được gửi ngay nhưng chỉ được chuyển đến consumer sau 30 phút. Khi consumer nhận message, nó kiểm tra trạng thái payment. Nếu payment chưa hoàn tất, order sẽ bị đóng. Nếu không, message sẽ bị bỏ qua.

Thay vì gửi immediate message, chúng ta có thể gửi delayed message vào temporary storage ở phía broker thay vì gửi ngay vào topic, rồi chuyển chúng vào topic khi đến thời điểm. Thiết kế cấp cao được minh họa trong Hình 4.36.

![Figure4.36.png](../../images/v2/chapter04/Figure4.36.png)

Hình 4.36: Delayed message

Các component cốt lõi của hệ thống gồm temporary storage và chức năng scheduling.

- Temporary storage có thể là một hoặc nhiều message topic đặc biệt.
- Chức năng scheduling nằm ngoài phạm vi thảo luận, nhưng dưới đây là hai giải pháp phổ biến:
  - Dedicated delayed queue với các delay level được định nghĩa trước[16]. Ví dụ, RocketMQ không hỗ trợ delayed message với độ chính xác thời gian tùy ý, nhưng hỗ trợ các delayed message theo level cụ thể. Các delay level của message là: 1 giây, 5 giây, 10 giây, 30 giây, 1 phút, 2 phút, 3 phút, 4 phút, 6 phút, 8 phút, 9 phút, 10 phút, 20 phút, 30 phút, 1 giờ và 2 giờ.
  - Hierarchical timing wheel[17].

Scheduled message nghĩa là message phải được chuyển cho consumer vào thời điểm đã định trước. Thiết kế tổng thể rất giống delayed message.

## Bước 4 - Tóm tắt

Trong chương này, chúng ta đã giới thiệu thiết kế hàng đợi message phân tán với một số tính năng nâng cao thường gặp trong data streaming platform. Nếu cuối cuộc phỏng vấn vẫn còn thời gian, dưới đây là một số điểm có thể thảo luận:

- Protocol: định nghĩa rule, syntax và API để trao đổi thông tin và truyền dữ liệu giữa các node khác nhau. Trong hàng đợi message phân tán, protocol cần:

  - Bao phủ mọi hoạt động như produce, consume, heartbeat, v.v.

  - Truyền hiệu quả lượng dữ liệu lớn.

  - Xác minh tính toàn vẹn và tính đúng đắn của dữ liệu.

  Một số protocol phổ biến gồm Advanced Message Queuing Protocol (AMQP)[18] và Kafka protocol[19].

- Retry consume: nếu một số message không thể được tiêu thụ thành công, chúng ta cần retry thao tác đó. Để không block các message tiếp theo, làm thế nào retry thao tác sau một khoảng thời gian? Một ý tưởng là gửi các message thất bại đến retry topic chuyên dụng để chúng có thể được tiêu thụ sau.
- Archive dữ liệu lịch sử: giả sử có cơ chế retention log dựa trên time hoặc capacity. Nếu consumer cần replay một số message lịch sử đã bị cắt bớt, chúng ta xử lý thế nào? Một giải pháp khả thi là sử dụng hệ thống storage capacity lớn như HDFS hoặc object storage để lưu dữ liệu lịch sử.

Chúc mừng bạn đã học đến đây! Hãy tự vỗ tay một cái, làm tốt lắm!

## Tóm tắt chương

![summary.png](../../images/v2/chapter04/summary.png)

## Tài liệu tham khảo

[1] Queue Length Limit. https://www.rabbitmq.com/docs/maxlength

[2] Apache ZooKeeper Wikipedia. https://en.wikipedia.org/wiki/Apache_ZooKeeper

[3] etcd. https://etcd.io

[4] MySQL. https://www.mysql.com

[5] Comparison of disk and memory performance. https://deliveryimages.acm.org/10.1145/1570000/1563874/jacobs3.jpg

[6] Push vs pull. https://kafka.apache.org/documentation/#design_pull

[7] Kafka 2.0 Documentation. https://kafka.apache.org/20/documentation.html#consumerconfigs

[8] Kafka No Longer Requires ZooKeeper. https://towardsdatascience.com/kafka-no-longer-requires-zookeeper-ebfbf3862104?gi=fe640259bf23

[9] Martin Kleppmann. Replication. In *Designing Data-Intensive Applications*, pages 151-197. O'Reilly Media, 2017.

[10] ISR in Apache Kafka. https://www.cloudkarafka.com/blog/what-does-in-sync-in-apache-kafka-really-mean.html

[11] Global map in a geographic Coordinate Reference System. https://cwiki.apache.org/confluence/display/KAFKA/KIP-39273A+Alow+consumers+to+fetch+from+closest+replica

[12] Hands-free Kafka Replication. https:/www.confluent.io/blog/hands-free-kafka-teplication-a-lesson-in-operational-simplicity

[13] Kafka high watermark: https://rongxinblog.wordpress.com/2016/07/29/kafka-high-watermark

[14] Kafka mirroring. https://wiki.apache.org/confluence/pages/viewpage.action?pageld=27846330

[15] Message filtering in RocketMQdtree. https://partners-intlaliyun.com/help/doc-detail/29543.htm

[16] Scheduled messages and delayed messages in Apache RocketMQ. https://partners-intlaliyun.com/help/doc-detail/43349.htm

[17] Hashed and hierarchical timing wheels. http://www.cs.columbia.edu/~nahum/w6998/papers/sosp87-timing-wheels.pdf

[18] Advanced Message Queuing Protocol. https://en.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol

[19] Kafka protocol guide. https://kafka.apache.org/protocol

[20] HDFS. https://hadoop.apache.org/docs/r1.2.1/hdfs_design.html
