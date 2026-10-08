# Chương 2 Bạn bè ở gần

Trong chương này, chúng ta sẽ thiết kế một backend có khả năng mở rộng cho một tính năng mới của ứng dụng di động: "bạn bè ở gần". Với những người dùng đã chọn tham gia và cấp quyền truy cập vị trí, client di động sẽ hiển thị danh sách những người bạn ở gần về mặt địa lý. Nếu muốn xem một ví dụ thực tế, bạn có thể tham khảo bài viết về tính năng tương tự của ứng dụng Facebook [1].

![Figure2.1.png](../images/v2/chapter02/Figure2.1.png)

Hình 2.1: Tính năng bạn bè ở gần của Facebook

Nếu đã đọc Chương 1, "Dịch vụ lân cận", có thể bạn sẽ thắc mắc tại sao chúng ta cần một chương riêng để thiết kế "bạn bè ở gần", vì nó trông khá giống dịch vụ lân cận. Nhưng nếu suy nghĩ kỹ, bạn sẽ thấy có những khác biệt đáng kể. Trong dịch vụ lân cận, địa chỉ của doanh nghiệp là tĩnh vì vị trí của chúng không thay đổi, còn trong "bạn bè ở gần", dữ liệu động hơn nhiều vì vị trí của người dùng thường xuyên thay đổi.

## Bước 1 - Hiểu vấn đề và xác định phạm vi thiết kế
Mọi backend đạt đến quy mô của Facebook đều rất phức tạp. Trước khi bắt đầu thiết kế, chúng ta cần đặt ra một số câu hỏi làm rõ để thu hẹp phạm vi.

Ứng viên: Khoảng cách bao nhiêu thì được xem là "ở gần"?  
Người phỏng vấn: 5 dặm. Con số này nên có thể cấu hình được.

Ứng viên: Tôi có thể giả định khoảng cách được tính theo đường thẳng giữa những người dùng không? Trong thực tế, giữa họ có thể có các chướng ngại vật như sông, khiến quãng đường di chuyển thực tế dài hơn.  
Người phỏng vấn: Đúng, đây là một giả định hợp lý.

Ứng viên: Ứng dụng có bao nhiêu người dùng? Tôi có thể giả định có 1 tỷ người dùng, trong đó 10% sử dụng tính năng bạn bè ở gần không?  
Người phỏng vấn: Đúng, đây là một giả định hợp lý.

Ứng viên: Chúng ta có cần lưu lịch sử vị trí không?  
Người phỏng vấn: Có, lịch sử vị trí có giá trị cho nhiều mục đích khác nhau, chẳng hạn như machine learning.

Ứng viên: Nếu một người bạn không hoạt động trong hơn 10 phút, người bạn đó có biến mất khỏi danh sách bạn bè ở gần không? Hay chúng ta nên hiển thị vị trí được biết gần đây nhất?  
Người phỏng vấn: Chúng ta có thể giả định rằng những người bạn không hoạt động sẽ không còn được hiển thị.

Ứng viên: Chúng ta có cần quan tâm đến các luật về quyền riêng tư và dữ liệu như GDPR hoặc CPA không?  
Người phỏng vấn: Câu hỏi hay. Để đơn giản hóa, hiện tại tạm thời không cần xem xét vấn đề này.

### Yêu cầu chức năng
- Người dùng phải có thể xem những người bạn ở gần trên ứng dụng di động. Mỗi mục bạn bè sẽ hiển thị khoảng cách đến người dùng và thời điểm gần nhất thông tin khoảng cách đó được cập nhật.
- Danh sách bạn bè ở gần nên được cập nhật sau mỗi vài giây.

### Yêu cầu phi chức năng
- Độ trễ thấp. Việc nhận cập nhật vị trí của bạn bè kịp thời là rất quan trọng.
- Độ tin cậy. Toàn bộ hệ thống cần đáng tin cậy, nhưng có thể chấp nhận việc đôi khi mất một vài điểm dữ liệu.
- Nhất quán cuối cùng. Kho lưu trữ dữ liệu vị trí không cần tính nhất quán mạnh. Có thể chấp nhận độ trễ vài giây khi dữ liệu vị trí được nhận ở các replica khác nhau.

### Ước tính sơ bộ
Hãy thực hiện một ước tính sơ bộ để xác định quy mô và những thách thức tiềm ẩn mà giải pháp cần xử lý. Dưới đây là một số ràng buộc và giả định:

- Bạn bè ở gần được định nghĩa là những người bạn có vị trí nằm trong bán kính 5 dặm.
- Khoảng thời gian refresh vị trí là 30 giây. Lý do là tốc độ đi bộ của con người khá chậm, trung bình 3~4 dặm một giờ. Quãng đường đi được trong 30 giây không ảnh hưởng nhiều đến tính năng "bạn bè ở gần".
- Trung bình mỗi ngày có 100 triệu người dùng sử dụng tính năng "bạn bè ở gần".
- Giả định số người dùng đồng thời bằng 10% DAU (người dùng hoạt động hằng ngày), nên số người dùng đồng thời là 10 triệu.
- Trung bình mỗi người dùng có 400 người bạn. Giả định tất cả bạn bè đều sử dụng tính năng "bạn bè ở gần".
- Ứng dụng hiển thị 20 người bạn ở gần trên mỗi trang và có thể tải thêm những người bạn ở gần theo request.

| Tính QPS                                                                                                                                                                |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| - 100 triệu DAU <br/> - Số người dùng đồng thời: 10% × 100 triệu = 10 triệu <br/> - Người dùng báo cáo vị trí mỗi 30 giây <br/> - OPS cập nhật vị trí = 10 triệu / 30 = ~334,000 |

Trong các chương khác, chúng ta thường thảo luận về thiết kế API và data model trước thiết kế cấp cao. Tuy nhiên, với bài toán này, giao thức giao tiếp giữa client và server có thể không phải là HTTP đơn giản, vì chúng ta cần đẩy dữ liệu vị trí đến tất cả bạn bè. Nếu chưa hiểu thiết kế cấp cao, sẽ khó biết API trông như thế nào. Vì vậy, chúng ta sẽ thảo luận về thiết kế cấp cao trước.

## Thiết kế cấp cao
Ở cấp độ khái quát, bài toán này cần một thiết kế messaging hiệu quả. Về mặt khái niệm, người dùng muốn nhận cập nhật vị trí của mọi người bạn đang hoạt động và ở gần. Về lý thuyết, có thể hoàn toàn sử dụng cách thức point-to-point, tức là người dùng duy trì một kết nối lâu dài với từng người bạn đang hoạt động ở gần (Hình 2.2).

![Figure2.2.png](../images/v2/chapter02/Figure2.2.png)  
Hình 2.2: Point-to-point

Giải pháp này không thực tế với các thiết bị di động có kết nối không ổn định và ngân sách pin hạn chế, nhưng ý tưởng này gợi mở một số định hướng cho thiết kế tổng thể.
Một thiết kế thực tế hơn là sử dụng một backend dùng chung, như trong Hình 2.3:

![Figure2.3.png](../images/v2/chapter02/Figure2.3.png)  
Hình 2.3: Backend dùng chung

Backend trong Hình 2.3 có trách nhiệm gì?
- Nhận cập nhật vị trí của tất cả người dùng đang hoạt động.
- Với mỗi cập nhật vị trí, tìm tất cả bạn bè đang hoạt động cần nhận cập nhật đó và chuyển tiếp nó đến thiết bị của những người dùng này.
- Nếu khoảng cách giữa hai người dùng vượt quá một ngưỡng nhất định, không chuyển tiếp cập nhật đến thiết bị của người nhận.

Nghe có vẻ đơn giản. Vấn đề là gì? Việc triển khai điều này ở quy mô lớn không hề dễ. Chúng ta có 10 triệu người dùng đang hoạt động. Mỗi người dùng cập nhật thông tin vị trí sau mỗi 30 giây, tương đương 334K cập nhật mỗi giây. Nếu trung bình mỗi người dùng có 400 người bạn và giả định thêm rằng khoảng 10% bạn bè đang online và ở gần, backend phải chuyển tiếp 334K × 400 × 10% = 14 triệu cập nhật vị trí mỗi giây. Đây là một lượng cập nhật rất lớn cần chuyển tiếp.

### Thiết kế đề xuất
Trước tiên, chúng ta sẽ đưa ra một thiết kế cấp cao cho backend có quy mô nhỏ hơn. Sau đó, trong phần đi sâu vào thiết kế, chúng ta sẽ tối ưu thiết kế để đạt khả năng mở rộng.
Hình 2.4 cho thấy thiết kế cơ bản cần đáp ứng các yêu cầu chức năng. Hãy lần lượt giới thiệu từng component trong thiết kế.

![Figure2.4.png](../images/v2/chapter02/Figure2.4.png)  
Hình 2.4: Thiết kế cấp cao

### Load balancer
Load balancer nằm phía trước các RESTful API server và các WebSocket server hai chiều có state. Nó phân phối traffic đến các server này để dàn đều tải.

### RESTful API server
Đây là một cluster HTTP server stateless, xử lý traffic request/response thông thường. Luồng xử lý API request được minh họa trong Hình 2.5. Tầng API này xử lý các tác vụ phụ trợ như thêm/xóa bạn bè, cập nhật profile người dùng, v.v. Đây đều là những việc phổ biến nên chúng ta sẽ không thảo luận chi tiết.

![Figure2.5.png](../images/v2/chapter02/Figure2.5.png)  
Hình 2.5: Luồng xử lý RESTful API request

### WebSocket server
Đây là một cluster stateful server, xử lý các cập nhật vị trí gần real-time của bạn bè. Mỗi client duy trì một kết nối WebSocket lâu dài với một trong các server này. Khi có cập nhật vị trí từ một người bạn nằm trong bán kính tìm kiếm, cập nhật đó được gửi đến client qua kết nối này.

Một trách nhiệm chính khác của WebSocket server là xử lý việc khởi tạo tính năng "bạn bè ở gần" ở client. Nó cung cấp cho client di động thông tin vị trí của tất cả bạn bè đang online và ở gần. Chúng ta sẽ thảo luận chi tiết hơn cách thực hiện việc này sau.
Lưu ý: Trong chương này, "kết nối WebSocket" và "connection handler của WebSocket" có thể được dùng thay thế cho nhau.

### Redis location cache
Redis được dùng để lưu dữ liệu vị trí mới nhất của mỗi người dùng đang hoạt động. Mỗi entry trong cache được thiết lập thời gian sống (TTL, Time To Live). Khi TTL hết hạn, người dùng được xem là không còn hoạt động và dữ liệu vị trí sẽ bị xóa khỏi cache. Mỗi lần cập nhật sẽ refresh TTL. Các KV storage khác hỗ trợ TTL cũng có thể được sử dụng.

### User database
User database lưu dữ liệu người dùng và dữ liệu quan hệ bạn bè của người dùng. Có thể sử dụng relational database hoặc NoSQL database.

### Location history database
Database này lưu dữ liệu lịch sử vị trí của người dùng. Nó không liên quan trực tiếp đến tính năng "bạn bè ở gần".

### Redis Pub/Sub server
Redis Pub/Sub[2] là một message bus rất nhẹ. Chi phí tạo channel trong Redis Pub/Sub thấp. Một Redis server hiện đại có dung lượng bộ nhớ tính bằng GB có thể chứa hàng triệu channel, còn gọi là topic. Hình 2.6 minh họa cách Redis Pub/Sub hoạt động.

![Figure2.6.png](../images/v2/chapter02/Figure2.6.png)  
Hình 2.6: Redis Pub/Sub

Trong thiết kế này, các cập nhật vị trí nhận được thông qua WebSocket server sẽ được publish vào channel riêng của người dùng trên Redis Pub/Sub server. Connection handler WebSocket chuyên dụng của mỗi người bạn đang hoạt động sẽ subscribe channel đó. Khi có cập nhật vị trí, hàm WebSocket handler sẽ được gọi và với mỗi người bạn đang hoạt động, hàm này sẽ tính lại khoảng cách. Nếu khoảng cách mới nằm trong bán kính tìm kiếm, vị trí mới và timestamp sẽ được gửi đến client của người bạn qua kết nối WebSocket. Các message bus khác có channel nhẹ cũng có thể được sử dụng.

Bây giờ chúng ta đã hiểu chức năng của từng component, hãy xem xét từ góc độ hệ thống điều gì xảy ra khi vị trí của người dùng thay đổi.

### Cập nhật vị trí định kỳ
Client di động gửi các cập nhật vị trí định kỳ qua một kết nối WebSocket lâu dài. Luồng xử lý được minh họa trong Hình 2.7.

![Figure2.7.png](../images/v2/chapter02/Figure2.7.png)  
Hình 2.7: Cập nhật vị trí định kỳ

1. Client di động gửi cập nhật vị trí đến load balancer.
2. Load balancer chuyển tiếp cập nhật vị trí đến kết nối lâu dài của client trên WebSocket server.
3. WebSocket server lưu dữ liệu vị trí vào location history database.
4. WebSocket server cập nhật vị trí mới trong location cache. Việc cập nhật sẽ refresh TTL. WebSocket server cũng lưu vị trí mới vào biến trong connection handler WebSocket của người dùng để dùng cho việc tính khoảng cách sau này.
5. WebSocket server publish vị trí mới vào channel của người dùng trên Redis Pub/Sub server. Bước 3 đến bước 5 có thể được thực hiện song song.
6. Khi Redis Pub/Sub nhận được cập nhật vị trí trên một channel, nó broadcast cập nhật đó đến tất cả subscriber (connection handler WebSocket). Trong trường hợp này, subscriber là tất cả bạn bè đang online của người dùng gửi cập nhật. Với mỗi subscriber, tức mỗi người bạn của người dùng, connection handler WebSocket tương ứng sẽ nhận được cập nhật vị trí của người dùng.
7. Khi nhận được message, WebSocket server, tức server nơi connection handler đang chạy, tính khoảng cách giữa người dùng gửi vị trí mới (dữ liệu vị trí nằm trong message) và subscriber (dữ liệu vị trí được lưu trong biến của connection handler WebSocket của subscriber).
8. Bước này không được minh họa trong hình. Nếu khoảng cách không vượt quá bán kính tìm kiếm, vị trí mới và timestamp cập nhật gần nhất sẽ được gửi qua kết nối WebSocket đến client của subscriber. Nếu không, cập nhật sẽ bị loại bỏ.

Vì hiểu rõ luồng này rất quan trọng, hãy kiểm tra lại bằng một ví dụ cụ thể như trong Hình 2.8. Trước khi bắt đầu, hãy đưa ra một số giả định.

- Bạn bè của người dùng 1: người dùng 2, người dùng 3 và người dùng 4
- Bạn bè của người dùng 5: người dùng 4 và người dùng 6

![Figure2.8.png](../images/v2/chapter02/Figure2.8.png)  
Hình 2.8: Gửi cập nhật vị trí đến bạn bè

1. Khi vị trí của người dùng 1 thay đổi, cập nhật vị trí của họ được gửi đến WebSocket server đang giữ kết nối của người dùng 1.
2. Vị trí được publish vào channel của người dùng 1 trên Redis Pub/Sub server.
3. Redis Pub/Sub server broadcast cập nhật vị trí đến tất cả subscriber. Trong trường hợp này, subscriber là các connection handler WebSocket của bạn bè người dùng 1.
4. Nếu khoảng cách giữa người gửi vị trí (người dùng 1) và subscriber (người dùng 2) không vượt quá bán kính tìm kiếm, vị trí mới sẽ được gửi đến client (người dùng 2).

Phép tính này được lặp lại cho từng subscriber của channel. Vì trung bình mỗi người dùng có 400 người bạn và chúng ta giả định 10% bạn bè đang online và ở gần, mỗi cập nhật vị trí của người dùng cần chuyển tiếp khoảng 40 lần.

### Thiết kế API
Bây giờ chúng ta đã tạo một thiết kế cấp cao, hãy liệt kê các API cần thiết.

WebSocket: Người dùng gửi và nhận cập nhật vị trí thông qua giao thức WebSocket. Tối thiểu cần các API sau.
1. Cập nhật vị trí định kỳ
   Request: client gửi latitude, longitude và timestamp
   Response: không có

2. Client nhận cập nhật vị trí
   Dữ liệu gửi đi: dữ liệu vị trí và timestamp của bạn bè

3. Khởi tạo WebSocket
   Request: client gửi latitude, longitude và timestamp
   Response: client nhận dữ liệu vị trí của bạn bè

4. Subscribe bạn bè mới
   Request: WebSocket server gửi ID của người bạn
   Response: latitude, longitude và timestamp mới nhất của người bạn

5. Unsubscribe bạn bè
   Request: WebSocket server gửi ID của người bạn
   Response: không có

HTTP request: API server xử lý các tác vụ như thêm/xóa bạn bè, cập nhật profile người dùng, v.v. Đây đều là những việc phổ biến nên chúng ta sẽ không thảo luận chi tiết ở đây.

### Data model
Một yếu tố quan trọng khác cần thảo luận là data model. Chúng ta đã thảo luận về user database trong thiết kế cấp cao, vì vậy hãy tập trung vào location cache và location history database.

### Location cache
Location cache lưu vị trí mới nhất của tất cả người dùng đang hoạt động đã bật tính năng bạn bè ở gần. Chúng ta sử dụng Redis cho cache này. Key/value của cache được trình bày trong Bảng 2.1.

![Table2.1.png](../images/v2/chapter02/Table2.1.png)
Bảng 2.1: Location cache

Tại sao không dùng database để lưu dữ liệu vị trí?
Tính năng "bạn bè ở gần" chỉ quan tâm đến vị trí hiện tại của người dùng. Vì vậy, chúng ta chỉ cần lưu một vị trí cho mỗi người dùng. Redis là một lựa chọn tốt vì cung cấp thao tác đọc/ghi rất nhanh. Nó hỗ trợ TTL, và chúng ta dùng TTL để tự động xóa những người dùng không còn hoạt động. Vị trí hiện tại không cần được lưu trữ lâu dài. Nếu Redis instance gặp sự cố, chúng ta có thể thay thế bằng một instance mới rỗng và để cache được lấp đầy khi các cập nhật vị trí mới đổ vào. Những người dùng đang hoạt động có thể bỏ lỡ một hoặc hai chu kỳ cập nhật vị trí của bạn bè trong lúc cache warm-up. Đây là một trade-off có thể chấp nhận. Trong phần đi sâu vào thiết kế, chúng ta sẽ thảo luận cách giảm ảnh hưởng đến người dùng khi cache được thay thế.

### Location history database
Location history database lưu dữ liệu lịch sử vị trí của người dùng, với schema như sau:

|user_id| latitude| longitude| timestamp|
|:----------:|:---------:|:---------:|:---------:|

Chúng ta cần một database có thể xử lý tốt workload ghi lớn và mở rộng theo chiều ngang. Cassandra là một ứng viên tốt. Chúng ta cũng có thể sử dụng relational database. Tuy nhiên, khi dùng relational database, dữ liệu lịch sử sẽ không thể vừa trong một instance duy nhất, vì vậy chúng ta cần sharding dữ liệu. Cách cơ bản nhất là shard theo user ID. Schema sharding này bảo đảm tải được phân bổ đều trên tất cả shard và dễ bảo trì về mặt vận hành.

## Bước 3 - Đi sâu vào thiết kế
Thiết kế cấp cao được tạo ở phần trước sẽ hoạt động trong hầu hết trường hợp, nhưng có thể gặp vấn đề ở quy mô của chúng ta. Trong phần này, chúng ta sẽ cùng tìm ra các bottleneck xuất hiện khi quy mô tăng lên và nghiên cứu các giải pháp loại bỏ những bottleneck đó.

Khả năng mở rộng của từng component như thế nào?
### API server
Cách mở rộng tầng RESTful API đã khá phổ biến. Đây là các stateless server, có nhiều cách để tự động scale cluster dựa trên mức sử dụng CPU, tải hoặc I/O. Chúng ta sẽ không thảo luận chi tiết ở đây.

### WebSocket server
Đối với WebSocket cluster, việc tự động scale theo mức sử dụng không khó. Tuy nhiên, WebSocket server là stateful nên cần cẩn thận khi loại bỏ một node hiện có. Trước khi có thể loại bỏ node, nên cho tất cả connection hiện tại kết thúc. Để thực hiện điều này, chúng ta có thể đánh dấu node là "đang drain" trên load balancer, để không có WebSocket connection mới nào được route đến server đang drain. Khi tất cả connection hiện tại đã đóng, hoặc đã chờ trong một khoảng thời gian hợp lý, server có thể được loại bỏ.
Việc phát hành phiên bản mới của application software trên WebSocket server cũng cần sự cẩn trọng tương tự.
Đáng chú ý là việc auto scaling hiệu quả cho stateful server là nhiệm vụ của một load balancer tốt. Hầu hết cloud load balancer đều xử lý tốt công việc này.

### Khởi tạo client
Khi khởi động, client di động thiết lập một kết nối WebSocket lâu dài với một WebSocket server instance. Mỗi connection chạy trong thời gian dài. Hầu hết ngôn ngữ hiện đại đều có thể duy trì nhiều connection chạy lâu dài với mức sử dụng bộ nhớ hợp lý.

Khi WebSocket connection được khởi tạo, client gửi vị trí ban đầu của người dùng, và server thực hiện các tác vụ sau trong connection handler WebSocket:

1. Cập nhật vị trí của người dùng trong location cache.
2. Lưu vị trí vào biến của connection handler để dùng cho các phép tính sau này.
3. Tải tất cả bạn bè của người dùng từ user database.
4. Gửi một batch request đến location cache để lấy vị trí của tất cả bạn bè. Lưu ý rằng vì chúng ta đặt TTL tương ứng với thời gian timeout không hoạt động trên mỗi entry trong location cache, nếu một người bạn không hoạt động thì vị trí của họ sẽ không có trong location cache.
5. Với mỗi vị trí được cache trả về, server tính khoảng cách giữa người dùng và người bạn ở vị trí đó. Nếu khoảng cách nằm trong bán kính tìm kiếm, profile, vị trí và timestamp cập nhật gần nhất của người bạn được trả về client qua WebSocket connection.
6. Với mỗi người bạn, server subscribe channel của người bạn trên Redis Pub/Sub server. Chúng ta sẽ giải thích việc sử dụng Redis Pub/Sub sau. Vì chi phí tạo channel mới thấp, người dùng subscribe channel của tất cả bạn bè, dù đang hoạt động hay không hoạt động. Những người bạn không hoạt động chiếm một lượng nhỏ bộ nhớ trên Redis Pub/Sub server, nhưng trước khi họ online sẽ không tiêu tốn CPU hoặc I/O nào vì họ không publish cập nhật.
7. Gửi vị trí hiện tại của người dùng vào channel của người dùng trên Redis Pub/Sub server.

### User database
User database chứa hai tập dữ liệu khác nhau: profile người dùng (user ID, username, profile URL, v.v.) và quan hệ bạn bè. Ở quy mô thiết kế của chúng ta, các tập dữ liệu này có thể không vừa trong một relational database instance duy nhất. Tin tốt là dữ liệu có thể mở rộng theo chiều ngang bằng sharding dựa trên user ID. Sharding relational database là một kỹ thuật rất phổ biến.
Một điểm ngoài lề là ở quy mô thiết kế này, các tập dữ liệu người dùng và quan hệ bạn bè nhiều khả năng được một team chuyên trách quản lý và cung cấp thông qua internal API. Trong trường hợp đó, WebSocket server sẽ dùng internal API thay vì query trực tiếp database để lấy dữ liệu liên quan đến người dùng và bạn bè. Dù truy cập qua API hay query trực tiếp database, khác biệt về chức năng hoặc hiệu năng không lớn.

### Location cache
Chúng ta chọn Redis để cache vị trí mới nhất của tất cả người dùng đang hoạt động. Như đã đề cập, chúng ta cũng đặt TTL trên mỗi key. TTL được cập nhật sau mỗi lần cập nhật vị trí. Điều này giới hạn mức sử dụng bộ nhớ tối đa. Ở thời điểm cao nhất có 10 triệu người dùng đang hoạt động, mỗi vị trí chiếm không quá 100 byte, một Redis server hiện đại có bộ nhớ vài GB sẽ dễ dàng chứa thông tin vị trí của tất cả người dùng.

Tuy nhiên, 10 triệu người dùng đang hoạt động cập nhật khoảng 30 giây một lần, nên Redis server sẽ phải xử lý 334K update mỗi giây. Con số này có thể hơi cao, ngay cả với một server hiện đại cao cấp. May mắn là dữ liệu cache này dễ shard. Dữ liệu vị trí của mỗi người dùng độc lập, và chúng ta có thể phân shard dữ liệu vị trí dựa trên user ID để phân bổ tải đều lên một vài Redis server.

Để tăng availability, chúng ta có thể replicate dữ liệu vị trí trên mỗi shard sang một node standby. Nếu primary node gặp sự cố, có thể nhanh chóng promote standby node để giảm thiểu downtime.

### Redis Pub/Sub server
Pub/Sub server đóng vai trò routing layer, định tuyến message (cập nhật vị trí) từ một người dùng đến tất cả bạn bè đang online. Như đã đề cập, chúng ta chọn Redis Pub/Sub vì chi phí tạo channel thấp. Channel được tạo khi có người subscribe. Nếu message được publish vào channel không có subscriber, message sẽ bị loại bỏ và tải lên server rất nhỏ. Khi tạo channel, Redis dùng một lượng nhỏ bộ nhớ để duy trì một hash table và một linked list[3] nhằm theo dõi subscriber. Nếu channel không có cập nhật khi người dùng offline, sau khi channel được tạo sẽ không tiêu tốn CPU cycle nào. Trong thiết kế của mình, chúng ta tận dụng các đặc tính này theo cách sau:

1. Chúng ta cấp một channel duy nhất cho mỗi người dùng sử dụng tính năng "bạn bè ở gần". Khi khởi tạo ứng dụng, người dùng sẽ subscribe channel của từng người bạn, bất kể người bạn đó có online hay không. Điều này đơn giản hóa thiết kế vì backend không cần xử lý việc subscribe channel của người bạn khi họ trở nên active hoặc unsubscribe khi họ trở nên inactive.
2. Trade-off này khiến thiết kế sử dụng nhiều bộ nhớ hơn. Như chúng ta sẽ thấy sau đây, mức sử dụng bộ nhớ khó có khả năng trở thành bottleneck. Trong trường hợp này, đánh đổi mức sử dụng bộ nhớ cao hơn để có architecture đơn giản hơn là đáng giá.

Chúng ta cần bao nhiêu Redis Pub/Sub server? Hãy tính mức sử dụng bộ nhớ và CPU.

Mức sử dụng bộ nhớ
Giả sử mỗi người dùng sử dụng tính năng bạn bè ở gần được cấp một channel, chúng ta cần 100 triệu channel (1 tỷ × 10%). Giả sử trung bình mỗi người dùng có 10 người bạn đang hoạt động sử dụng tính năng này (bao gồm cả bạn bè ở gần và không ở gần), và việc theo dõi mỗi subscriber trong hash table và linked list nội bộ cần khoảng 20 byte pointer, chúng ta cần khoảng 200GB (100 triệu × 20 byte × 10 người bạn / 10^9 = 20GB) để lưu tất cả channel. Với một server hiện đại có 100GB bộ nhớ, chúng ta cần khoảng 2 Redis Pub/Sub server để lưu tất cả channel.

Mức sử dụng CPU
Như đã tính ở trên, Pub/Sub server đẩy khoảng 14 triệu update đến subscriber mỗi giây. Dù rất khó ước tính chính xác một Redis server hiện đại có thể đẩy bao nhiêu message mỗi giây nếu không có benchmark thực tế, có thể an toàn giả định rằng một Redis server không thể xử lý tải này. Hãy chọn một con số thận trọng, giả định server hiện đại có mạng gigabit có thể xử lý khoảng 100.000 lần push đến subscriber mỗi giây. Vì message cập nhật vị trí của chúng ta rất nhỏ, con số này có thể quá thận trọng. Theo ước tính thận trọng này, chúng ta cần phân bổ tải lên 14 triệu / 100.000 = 140 Redis server. Một lần nữa, con số này có thể quá thận trọng và số server thực tế cần thiết có thể ít hơn nhiều.

Từ các phép tính, chúng ta rút ra kết luận:
- Bottleneck của Redis Pub/Sub server là mức sử dụng CPU, không phải mức sử dụng bộ nhớ
- Để hỗ trợ quy mô của chúng ta, cần một Redis Pub/Sub cluster phân tán

### Redis Pub/Sub server cluster phân tán
Làm thế nào để phân phối channel lên hàng trăm Redis server? Tin tốt là các channel độc lập với nhau. Điều này khiến việc shard dựa trên user ID của publisher để phân tán channel lên nhiều Pub/Sub server tương đối dễ dàng. Nhưng xét về vận hành thực tế, khi có hàng trăm Pub/Sub server, chúng ta nên thảo luận chi tiết hơn về cách thực hiện vì server chắc chắn sẽ thỉnh thoảng gặp sự cố.

Ở đây, chúng ta đưa một service discovery component vào thiết kế. Có nhiều service discovery package sẵn có, trong đó etcd[4] và ZooKeeper[5] là những lựa chọn phổ biến nhất. Yêu cầu của chúng ta đối với service discovery component khá cơ bản. Chúng ta cần hai chức năng:

1. Có khả năng lưu danh sách server trong service discovery component và cung cấp UI hoặc API đơn giản để cập nhật danh sách. Về bản chất, service discovery là một key-value storage nhỏ dùng để lưu configuration data. Lấy Hình 2.9 làm ví dụ, key và value của hash ring có thể như sau:
```
Key: /config/pub_sub_ring
Value: ["p_1", "p_2", "p_3", "p_4"]
```

2. Client, trong trường hợp này là WebSocket server, có khả năng subscribe mọi cập nhật của "Value" (Redis Pub/Sub server).

Trong "Key" được đề cập ở mục 1, chúng ta lưu hash ring của tất cả Redis Pub/Sub server đang hoạt động trong service discovery component (để biết chi tiết về hash ring, hãy xem chương Consistent Hashing trong System Design Interview Volume 1 hoặc [6]). Publisher và subscriber của Redis Pub/Sub server sử dụng hash ring để xác định mỗi channel cần giao tiếp với Pub/Sub server nào. Ví dụ, trong Hình 2.9, channel 2 nằm trên Redis Pub/Sub server 1.

![Figure2.9.png](../images/v2/chapter02/Figure2.9.png)
Hình 2.9: Consistent hashing

Hình 2.10 cho thấy điều gì xảy ra khi WebSocket server publish cập nhật vị trí vào channel của người dùng.

![Figure2.10.png](../images/v2/chapter02/Figure2.10.png)
Hình 2.10: Xác định Redis Pub/Sub server phù hợp

1. WebSocket server query hash ring để xác định Redis Pub/Sub server cần ghi vào. Dữ liệu thực tế được lưu trong service discovery, nhưng để tăng hiệu năng, mỗi WebSocket server có thể cache một bản sao của hash ring. WebSocket server subscribe mọi cập nhật của hash ring để giữ bản sao trong memory luôn mới nhất.
2. WebSocket server publish cập nhật vị trí vào channel của người dùng trên Redis Pub/Sub server đó.

Việc subscribe channel để nhận cập nhật vị trí cũng dùng cơ chế tương tự.

### Các cân nhắc về việc scale Redis Pub/Sub server
Chúng ta nên scale Redis Pub/Sub server cluster như thế nào? Có nên scale up/down hằng ngày theo traffic pattern không? Đây là một cách làm rất phổ biến với stateless server vì rủi ro thấp và có thể tiết kiệm chi phí. Để trả lời các câu hỏi này, hãy xem xét một số đặc tính của Redis Pub/Sub server cluster.

1. Message được gửi trên Pub/Sub channel không được persist trong memory hoặc disk. Chúng bị xóa ngay sau khi được gửi đến tất cả subscriber của channel. Nếu không có subscriber, message sẽ bị loại bỏ. Theo nghĩa này, dữ liệu đi qua Pub/Sub channel là stateless.

2. Tuy nhiên, Pub/Sub server thực sự lưu state của channel. Cụ thể, danh sách subscriber của mỗi channel là state quan trọng được Pub/Sub server theo dõi. Nếu một channel được di chuyển, điều có thể xảy ra khi Pub/Sub server của channel được thay thế hoặc khi thêm server mới vào hash ring hay xóa server cũ, mọi subscriber của channel được di chuyển phải biết việc này để có thể unsubscribe channel khỏi server cũ và subscribe lại channel thay thế trên server mới. Theo nghĩa này, Pub/Sub server là stateful, và cần điều phối thao tác với tất cả subscriber của server để giảm thiểu gián đoạn dịch vụ.

Vì những lý do này, chúng ta nên xem Redis Pub/Sub cluster giống một stateful cluster hơn, tương tự cách xử lý storage cluster. Với stateful cluster, scale up/down có một số chi phí vận hành và rủi ro, vì vậy cần được lên kế hoạch cẩn thận. Thông thường, cluster sẽ được provision dư để bảo đảm có thể xử lý traffic cao điểm hằng ngày và vẫn còn một khoảng đệm an toàn, tránh phải điều chỉnh cluster không cần thiết.

Khi chắc chắn cần scale, hãy lưu ý các vấn đề tiềm ẩn sau:
- Khi thay đổi kích thước cluster, nhiều channel trên hash ring sẽ được chuyển sang server khác. Khi service discovery component thông báo cập nhật hash ring cho tất cả WebSocket server, sẽ phát sinh một lượng lớn request subscribe lại.
- Trong các sự kiện subscribe lại quy mô lớn này, client có thể bỏ lỡ một số cập nhật vị trí. Dù việc mất dữ liệu không thường xuyên có thể chấp nhận trong thiết kế của chúng ta, chúng ta nên cố gắng giảm thiểu khả năng này.
- Do có thể xảy ra gián đoạn, nên thực hiện điều chỉnh vào thời điểm có lượng sử dụng thấp nhất trong ngày.

Thực tế điều chỉnh như thế nào? Rất đơn giản. Làm theo các bước sau:
- Xác định kích thước ring mới; nếu scale up, provision đủ server mới
- Cập nhật key của hash ring bằng nội dung mới
- Theo dõi dashboard. Mức sử dụng CPU của WebSocket cluster sẽ có một số đợt tăng đột biến

Sử dụng hash ring trong Hình 2.9 ở trên, nếu muốn thêm 2 node mới, chẳng hạn p_5 và p_6, hash ring sẽ được cập nhật như sau:
```
Cũ：["p_1", "p_2", "p_3", "p_4"]
Mới：["p_1", "p_2", "p_3", "p_4", "p_5", "p_6"]
```

### Các cân nhắc vận hành đối với Redis Pub/Sub server
Rủi ro vận hành khi thay thế một Redis Pub/Sub server hiện tại thấp hơn nhiều. Việc này không khiến nhiều channel bị di chuyển. Chỉ cần xử lý các channel trên server được thay thế. Điều này tốt vì server chắc chắn sẽ thỉnh thoảng gặp sự cố và cần được thay thế định kỳ.

Khi Pub/Sub server gặp sự cố, phần mềm monitoring nên kịp thời thông báo cho nhân viên vận hành trực. Như đã nói, chương này không đi vào chi tiết cách phần mềm monitoring theo dõi tình trạng health của Pub/Sub server. Nhân viên vận hành trực cập nhật key hash ring trong service discovery, thay node đã hỏng bằng node standby mới. WebSocket server sẽ nhận được thông báo cập nhật, sau đó mỗi server thông báo cho connection handler của mình subscribe lại channel trên Pub/Sub server mới. Mỗi WebSocket handler lưu danh sách tất cả channel đã subscribe. Sau khi nhận thông báo từ server, handler kiểm tra mapping của từng channel với hash ring để xác định có cần subscribe lại channel trên server mới hay không.

Sử dụng hash ring trong Hình 2.9 ở trên, nếu p_1 gặp sự cố, chúng ta thay thế nó bằng p1_new, và hash ring sẽ được cập nhật như sau:
```
Cũ：["p_1", "p_2", "p_3", "p_4"]
Mới：["p1_new", "p_2", "p_3", "p_4"]
```

![Figure2.11.png](../images/v2/chapter02/Figure2.11.png)
Hình 2.11: Thay thế Pub/Sub server

### Thêm/xóa bạn bè
Client nên làm gì khi người dùng thêm hoặc xóa bạn bè? Khi thêm một người bạn mới, cần thông báo cho connection handler WebSocket của client để nó có thể subscribe channel Pub/Sub của người bạn mới.

Vì tính năng "bạn bè ở gần" là một phần của hệ sinh thái ứng dụng lớn hơn, chúng ta có thể giả định tính năng này có thể đăng ký một callback trên client di động, được trigger khi thêm bạn mới. Khi callback được gọi, một message sẽ được gửi đến WebSocket server để subscribe channel Pub/Sub của người bạn mới. Nếu người bạn mới đang active, WebSocket server cũng trả về một message chứa vị trí mới nhất và timestamp của người bạn mới.

Tương tự, khi xóa một người bạn, client có thể đăng ký một callback trong application. Callback sẽ gửi message đến WebSocket server để unsubscribe channel Pub/Sub của người bạn đó.

Callback subscribe/unsubscribe này cũng có thể được dùng khi một người bạn opt in hoặc opt out khỏi việc cập nhật vị trí.

### Người dùng có nhiều bạn bè
Đáng thảo luận là liệu người dùng có nhiều bạn bè có tạo ra hotspot về hiệu năng trong thiết kế của chúng ta hay không. Ở đây, chúng ta giả định số lượng bạn bè có một giới hạn cứng (ví dụ, Facebook giới hạn tối đa 5000 bạn bè). Quan hệ bạn bè là hai chiều, khác với mô hình follower, trong đó một người nổi tiếng có thể có hàng triệu follower.

Trong kịch bản có hàng nghìn bạn bè, subscriber của Pub/Sub sẽ được phân tán trên nhiều WebSocket server trong cluster. Tải cập nhật sẽ được phân bổ giữa các server này và khó có khả năng tạo ra hotspot.

Người dùng sẽ tạo ra lượng tải hơi lớn hơn trên Pub/Sub server nơi channel của họ nằm. Vì có hơn 100 Pub/Sub server, những người dùng "lớn" này sẽ được phân tán giữa các Pub/Sub server, và tải tăng thêm không nên khiến bất kỳ server đơn lẻ nào quá tải.

### Người lạ ngẫu nhiên ở gần
Bạn có thể xem phần này như một điểm cộng thêm vì nó không nằm trong yêu cầu chức năng ban đầu. Nếu người phỏng vấn muốn cập nhật thiết kế để hiển thị những người lạ chọn chia sẻ vị trí thì sao?

Một cách tận dụng thiết kế của chúng ta là thêm một pool Pub/Sub channel theo geohash. (Để biết chi tiết về geohash, hãy xem Chương 1, "Dịch vụ lân cận"). Như trong Hình 2.12, một khu vực được chia thành bốn geohash grid và một channel được tạo cho mỗi grid.

![Figure2.12.png](../images/v2/chapter02/Figure2.12.png)
Hình 2.12: Redis Pub/Sub channel

Mọi người trong cùng một grid đều subscribe cùng một channel. Hãy lấy grid 9q8znd trong Hình 2.13 làm ví dụ.

![Figure2.13.png](../images/v2/chapter02/Figure2.13.png)
Hình 2.13: Publish cập nhật vị trí đến những người lạ ở gần

1. Ở đây, khi người dùng 2 cập nhật vị trí, connection handler WebSocket tính geohash ID của người dùng và gửi vị trí vào channel của geohash đó.
2. Bất kỳ ai ở gần đã subscribe channel đó (ngoại trừ người gửi) đều nhận được message cập nhật vị trí.

Để xử lý những người ở gần ranh giới của geohash grid, mỗi client có thể subscribe geohash nơi người dùng đang ở và tám geohash grid xung quanh. Hình 2.14 minh họa một ví dụ với tất cả 9 geohash grid được highlight.

![Figure2.14.png](../images/v2/chapter02/Figure2.14.png)
Hình 2.14: Chín geohash grid

### Các giải pháp thay thế cho Redis Pub/Sub
Có giải pháp thay thế tốt nào cho Redis Pub/Sub với vai trò routing layer không? Câu trả lời là có. Erlang[7] là một giải pháp tốt cho bài toán cụ thể này. Chúng tôi cho rằng Erlang là giải pháp tốt hơn Redis Pub/Sub được đề xuất ở trên. Tuy nhiên, Erlang khá ít phổ biến và khó tuyển được lập trình viên Erlang giỏi. Nhưng nếu team của bạn có chuyên môn về Erlang, đây là một lựa chọn rất tốt.

Vậy tại sao lại chọn Erlang? Erlang là một ngôn ngữ lập trình đa dụng và runtime environment được xây dựng cho các ứng dụng có tính phân tán và concurrency cao. Khi nói Erlang ở đây, chúng tôi muốn nói cụ thể đến chính hệ sinh thái Erlang. Hệ sinh thái này bao gồm các thành phần ngôn ngữ (Erlang hoặc Elixir[8]) và runtime environment cùng library (Erlang virtual machine có tên BEAM[9] và Erlang runtime library có tên OTP[10]).

Điểm mạnh của Erlang nằm ở các lightweight process. Erlang process là một entity chạy trên BEAM VM. Nó rẻ hơn process của Linux vài bậc độ lớn. Một Erlang process tối thiểu chiếm khoảng 300 byte, và chúng ta có thể chạy hàng triệu process như vậy trên một server hiện đại duy nhất. Nếu Erlang process không có việc cần làm, nó chỉ nằm đó và hoàn toàn không sử dụng CPU cycle nào. Nói cách khác, trong thiết kế của chúng ta, việc model mỗi người trong số 10 triệu người dùng đang hoạt động thành một Erlang process duy nhất là rất rẻ.

Erlang cũng dễ dàng được phân tán trên nhiều Erlang server. Chi phí vận hành thấp, có tool hỗ trợ tốt để debug an toàn các vấn đề production đang diễn ra. Các deployment tool cũng rất mạnh.

Chúng ta sử dụng Erlang trong thiết kế như thế nào? Chúng ta sẽ dùng Erlang để triển khai WebSocket service và thay thế toàn bộ Redis Pub/Sub cluster bằng một distributed Erlang application. Trong application này, mỗi người dùng được model thành một Erlang process. Khi client cập nhật vị trí của người dùng, user process nhận cập nhật từ WebSocket server. User process cũng subscribe các cập nhật từ Erlang process của bạn bè người dùng. Subscription là tính năng native trong Erlang/OTP và dễ xây dựng. Điều này tạo thành một mạng lưới connection có thể định tuyến hiệu quả các cập nhật vị trí từ một người dùng đến nhiều bạn bè.

## Bước 4 - Tóm tắt
Trong chương này, chúng ta đã đưa ra một thiết kế hỗ trợ tính năng bạn bè ở gần. Về mặt khái niệm, chúng ta muốn thiết kế một hệ thống có thể truyền hiệu quả các cập nhật vị trí từ một người dùng đến bạn bè của họ.

Một số component cốt lõi bao gồm:
- WebSocket: giao tiếp real-time giữa client và server
- Redis: đọc/ghi dữ liệu vị trí nhanh
- Redis Pub/Sub: routing layer, định tuyến cập nhật vị trí từ một người dùng đến tất cả bạn bè đang online

Trước tiên, chúng ta đưa ra một thiết kế cấp cao ở quy mô thấp hơn, sau đó thảo luận về những thách thức xuất hiện khi quy mô tăng lên. Chúng ta đã tìm hiểu cách scale các thành phần sau:
- RESTful API server
- WebSocket server
- Data layer
- Redis Pub/Sub server
- Các giải pháp thay thế cho Redis Pub/Sub

Cuối cùng, chúng ta thảo luận về các bottleneck tiềm ẩn khi người dùng có nhiều bạn bè và đưa ra một thiết kế cho tính năng "người lạ ở gần".  
Chúc mừng bạn đã đi đến đây! Bây giờ hãy tự động viên mình một chút. Làm tốt lắm!

## Tài liệu tham khảo
[1] Facebook ra mắt "Bạn bè ở gần". https://techcrunch.com/2014/04/17/facebook-nearby-friends/  
[2] Redis Pub/Sub. https://redis.io/topics/pubsub  
[3] Redis Pub/Sub bên trong. https://making.pusher.com/redis-pubsub-under-the-hood/  
[4] etcd. https://etcd.io/  
[5] ZooKeeper. https://zookeeper.apache.org/  
[6] Consistent hashing. https://www.toptal.com/big-data/consistent-hashing  
[7] Erlang. https://www.erlang.org/  
[8] Elixir. https://elixir-lang.org/  
[9] Giới thiệu BEAM. https://www.erlang.org/blog/a-brief-beam-primer/  
[10] OTP. https://www.erlang.org/doc/design_principles/des_princ.html
