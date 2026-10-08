# 3 Google Maps

Trong chương này, chúng ta sẽ thiết kế một phiên bản Google Maps đơn giản hóa. Trước khi bắt đầu thiết kế hệ thống, hãy tìm hiểu đôi nét về Google Maps. Google bắt đầu dự án Google Maps vào năm 2005 và phát triển một dịch vụ bản đồ trên web. Dịch vụ này cung cấp nhiều tính năng, chẳng hạn như ảnh vệ tinh, bản đồ đường phố, tình trạng giao thông theo thời gian thực và lập kế hoạch lộ trình [1].

Google Maps giúp người dùng tìm đường và điều hướng đến đích. Tính đến tháng 3 năm 2021, Google Maps có 1 tỷ người dùng hoạt động hằng ngày, phủ 99% diện tích toàn cầu và nhận được 25 triệu bản cập nhật mỗi ngày về thông tin vị trí chính xác, theo thời gian thực [2]. Vì Google Maps cực kỳ phức tạp, điều quan trọng là phải xác định các tính năng mà phiên bản của chúng ta sẽ hỗ trợ.

## Bước 1 - Hiểu vấn đề và xác định phạm vi thiết kế

Cuộc trao đổi giữa người phỏng vấn và ứng viên có thể diễn ra như sau:

**Ứng viên:** Chúng ta dự kiến có bao nhiêu người dùng hoạt động hằng ngày?  
**Người phỏng vấn:** 1 tỷ DAU.

**Ứng viên:** Chúng ta nên tập trung vào những tính năng nào? Chỉ đường, điều hướng và thời gian dự kiến đến nơi (ETA)?  
**Người phỏng vấn:** Tôi rất vui vì bạn đã hỏi và cân nhắc những điều đó. Chúng ta không cần thiết kế tất cả các tính năng này.

**Ứng viên:** Hệ thống có cần xét đến tình trạng giao thông không?  
**Người phỏng vấn:** Có, tình trạng giao thông rất quan trọng để ước tính ETA chính xác.

**Ứng viên:** Còn các phương thức di chuyển khác nhau như lái xe, đi bộ, xe buýt thì sao?  
**Người phỏng vấn:** Chúng ta nên hỗ trợ nhiều phương thức di chuyển khác nhau.

**Ứng viên:** Chúng ta có nên hỗ trợ lộ trình qua nhiều điểm dừng không?  
**Người phỏng vấn:** Cho phép người dùng xác định nhiều điểm dừng là tốt, nhưng tạm thời hãy chưa tập trung vào việc đó.

**Ứng viên:** Còn địa điểm và ảnh của doanh nghiệp thì sao? Chúng ta dự kiến có bao nhiêu ảnh?  
**Người phỏng vấn:** Tôi rất vui vì bạn đã hỏi và cân nhắc những điều đó. Chúng ta không cần thiết kế các tính năng này.

Trong phần còn lại của chương, chúng ta tập trung vào ba tính năng chính. Thiết bị chủ yếu mà chúng ta cần hỗ trợ là điện thoại di động.

*   Cập nhật vị trí người dùng.
*   Dịch vụ điều hướng, bao gồm dịch vụ ETA.
*   Kết xuất bản đồ.

### Yêu cầu phi chức năng và ràng buộc

*   **Độ chính xác:** Không được đưa ra chỉ dẫn sai cho người dùng.
*   **Điều hướng mượt mà:** Ở phía client, người dùng phải có trải nghiệm kết xuất bản đồ thật mượt.
*   **Mức sử dụng dữ liệu và pin:** Client nên sử dụng càng ít dữ liệu và pin càng tốt. Điều này đặc biệt quan trọng trên thiết bị di động.
*   **Các yêu cầu chung về tính khả dụng và khả năng mở rộng.**

Trước khi đi sâu vào thiết kế, chúng ta sẽ giới thiệu ngắn gọn một số khái niệm và thuật ngữ cơ bản hữu ích khi thiết kế Google Maps.

### Map 101

#### Hệ tọa độ
Trái Đất là một khối cầu quay quanh trục của nó. Cực Bắc ở trên cùng và Cực Nam ở dưới cùng.

![Hình 3.1: Vĩ độ và kinh độ](../../images/v2/chapter03/Figure3.1.png)  
[Hình 3.1: Vĩ độ và kinh độ (nguồn: [3])]

*   **Vĩ độ (Latitude):** Cho biết chúng ta đang ở xa về phía bắc hay phía nam đến mức nào
*   **Kinh độ (Longitude):** Cho biết chúng ta đang ở xa về phía đông hay phía tây đến mức nào

#### Từ 3D sang 2D
Quá trình chuyển các điểm trên một khối cầu 3D sang một mặt phẳng 2D được gọi là "phép chiếu bản đồ".
Có nhiều cách chiếu bản đồ khác nhau, mỗi cách đều có ưu điểm và nhược điểm riêng. Gần như mọi cách chiếu đều làm biến dạng hình học thực tế. Dưới đây là một số ví dụ.

![Hình 3.2: Phép chiếu bản đồ](../../images/v2/chapter03/Figure3.2.png)  
[Hình 3.2: Phép chiếu bản đồ (nguồn: Wikipedia [4] [5] [6] [7])]  
*   Phép chiếu Mercator (Mercator projection)
*   Phép chiếu hoa thị Peirce (Peirce quincuncial projection)
*   Phép chiếu Gall-Peters (Gall-Peters projection)
*   Phép chiếu Winkel Tripel (Winkel tripel projection)

Google Maps chọn một phiên bản sửa đổi của phép chiếu Mercator, được gọi là Web Mercator. Để biết thêm chi tiết về hệ tọa độ và phép chiếu, hãy tham khảo [3].

#### Geocoding
Geocoding là quá trình chuyển đổi địa chỉ thành tọa độ địa lý. Ví dụ, "1600 Amphitheatre Parkway, Mountain View, CA" được geocoding thành một cặp vĩ độ/kinh độ (vĩ độ 37.423021, kinh độ -122.083739).
Ngược lại, quá trình chuyển một cặp vĩ độ/kinh độ thành địa chỉ thực tế mà con người có thể đọc được được gọi là reverse geocoding.

Một phương pháp geocoding là nội suy [8]. Phương pháp này sử dụng dữ liệu từ nhiều nguồn khác nhau, chẳng hạn như hệ thống thông tin địa lý (GIS), trong đó mạng lưới đường phố được ánh xạ vào không gian tọa độ địa lý.

#### Geohashing
Geohashing là một hệ thống mã hóa dùng để mã hóa một khu vực địa lý thành một chuỗi ngắn gồm chữ cái và chữ số. Ý tưởng cốt lõi là mô tả Trái Đất như một bề mặt phẳng, rồi đệ quy chia lưới thành các lưới con cho đến khi mỗi lưới đạt một ngưỡng kích thước nhất định. Chúng ta biểu diễn các lưới bằng các chuỗi chữ số từ 0 đến 3, được tạo ra một cách đệ quy.

Giả sử kích thước mặt phẳng ban đầu là 20,000km x 10,000km. Sau lần chia đầu tiên, chúng ta có 4 lưới với kích thước 10,000km x 5,000km. Chúng được biểu diễn bằng 00, 01, 10 và 11 như trong Hình 3.3. Tiếp tục chia mỗi lưới thành 4 lưới và sử dụng cùng một quy tắc đặt tên. Kích thước mỗi lưới con lúc này là 5,000km x 2,500km. Chúng ta tiếp tục chia đệ quy cho đến khi mỗi lưới đạt một ngưỡng kích thước nhất định.

![Hình 3.3: Geohashing](../../images/v2/chapter03/Figure3.3.png)  
[Hình 3.3: Geohashing]  
Cấp 0: 01, 11, 00, 10
Cấp 1: 0101, 0111, ... , 1010
Cấp 2: 010101, 010111, ... , 101010
...
Các map tile lấy từ Stamen Design, theo giấy phép CC BY 3.0. Dữ liệu do các contributor của OpenStreetMap cung cấp.

Geohashing có nhiều ứng dụng. Trong thiết kế của chúng ta, geohashing được dùng để chia bản đồ thành các map tile. Để biết thêm chi tiết về geohashing và lợi ích của nó, hãy tham khảo [9].

#### Kết xuất bản đồ
Chúng ta sẽ không đi sâu vào việc kết xuất bản đồ, nhưng một số kiến thức nền tảng đáng được nhắc đến. Một khái niệm cơ bản trong kết xuất bản đồ là chia thành tile. Thay vì kết xuất toàn bộ bản đồ trong một lần, việc có thể là vấn đề với ảnh lớn, chúng ta chia thế giới thành các tile nhỏ hơn. Client chỉ tải xuống các tile liên quan đến khu vực nơi người dùng đang ở rồi ghép chúng lại như một bức tranh ghép hình để hiển thị.

Có các tập tile khác nhau tương ứng với các cấp độ zoom khác nhau của bản đồ. Client chọn tập tile phù hợp dựa trên cấp độ zoom của viewport bản đồ. Điều này cung cấp mức độ chi tiết bản đồ phù hợp mà không tiêu tốn quá nhiều băng thông. Để minh họa, giả sử client thu nhỏ hoàn toàn để hiển thị toàn thế giới, chúng ta không cần tải xuống hàng nghìn tile ở cấp độ zoom cao. Toàn bộ chi tiết đó sẽ bị lãng phí. Thay vào đó, client sẽ tải xuống một tile ở cấp độ zoom thấp nhất, tile này biểu diễn toàn thế giới bằng một ảnh 256 x 256 pixel duy nhất.

#### Xử lý dữ liệu đường cho các thuật toán điều hướng
Hầu hết thuật toán định tuyến là biến thể của thuật toán tìm đường Dijkstra hoặc A*. Việc chọn thuật toán chính xác là một chủ đề phức tạp và chúng ta sẽ không đi sâu trong chương này. Điều quan trọng cần lưu ý là tất cả các thuật toán này đều chạy trên cấu trúc dữ liệu graph, trong đó giao lộ là node và đường là edge của graph. Hình 3.4 minh họa một ví dụ:

![Hình 3.4: Bản đồ dưới dạng graph](../../images/v2/chapter03/Figure3.4.png)  
[Hình 3.4: Bản đồ dưới dạng graph]  
Các map tile lấy từ Stamen Design, theo giấy phép CC BY 3.0. Dữ liệu do các contributor của OpenStreetMap cung cấp.

Hiệu năng tìm đường cực kỳ nhạy cảm với kích thước graph. Biểu diễn toàn bộ mạng lưới đường trên thế giới bằng một graph duy nhất sẽ tiêu tốn quá nhiều bộ nhớ và quá lớn để bất kỳ thuật toán nào trong số này có thể chạy hiệu quả. Chúng ta cần chia graph thành các đơn vị có thể quản lý được để phù hợp với quy mô thiết kế.

Một cách là chia thế giới thành các lưới nhỏ gọi là routing tile. Chúng ta thực hiện việc này bằng cách áp dụng các kỹ thuật chia thành tile như geohashing. Chúng ta chia thế giới thành các lưới nhỏ. Với mỗi lưới, chúng ta trích xuất các đường trong lưới (giao lộ) và các edge (đường) được bao phủ bởi khu vực địa lý của lưới để tạo thành một cấu trúc dữ liệu graph. Chúng được gọi là routing tile. Mỗi routing tile giữ tham chiếu đến tất cả các tile khác kết nối với nó. Nhờ đó, thuật toán định tuyến có thể ghép chúng lại thành một routing graph lớn hơn, đại diện cho các routing tile liên kết với nhau.

Bằng cách chia mạng lưới đường thành các routing tile, các tile này có thể được tải theo nhu cầu. Thuật toán định tuyến nhờ đó giảm đáng kể mức tiêu thụ bộ nhớ và cải thiện hiệu năng tìm đường bằng cách chỉ tải một nhóm nhỏ routing tile khi cần, đồng thời chỉ tải thêm tile khi cần thiết.

![Hình 3.5: Routing tile](../../images/v2/chapter03/Figure3.5.png)  
[Hình 3.5: Routing tile]  
Routing tile 1 | Routing tile 2 | Routing tile 3
Các map tile lấy từ Stamen Design, theo giấy phép CC BY 3.0. Dữ liệu do các contributor của OpenStreetMap cung cấp.

> **Nhắc lại**
> Trong Hình 3.5, chúng ta gọi các lưới này là routing tile. Routing tile tương tự map tile vì cả hai đều là các lưới bao phủ một số khu vực địa lý. Map tile là ảnh PNG, còn routing tile là các file nhị phân chứa dữ liệu đường bao phủ khu vực của tile.

#### Routing tile phân cấp (Hierarchical routing tiles)
Định tuyến hiệu quả còn cần dữ liệu đường ở đúng mức độ chi tiết. Ví dụ, với một lộ trình xuyên quốc gia, chạy thuật toán định tuyến ở mức chi tiết thấp nhất sẽ chậm. Graph được ghép lại để tạo thành các routing tile chi tiết ở cấp đường phố. Kết quả là một routing graph chi tiết có thể quá lớn và tiêu tốn quá nhiều bộ nhớ.

Thông thường có ba nhóm routing tile với các mức độ chi tiết khác nhau. Ở mức chi tiết nhất, routing tile nhỏ và chỉ chứa các đường địa phương. Ở cấp tiếp theo, tile lớn hơn và chứa các tuyến đường chính kết nối các khu vực. Ở mức chi tiết thấp nhất, tile bao phủ các khu vực rộng lớn và chứa các xa lộ chính kết nối các thành phố và bang. Ở mỗi cấp, các tile có thể kết nối qua edge để tạo thành routing graph chạy ở các cấp độ zoom khác nhau. Ví dụ, với lối vào xa lộ từ đường địa phương A đến xa lộ F, trong tile nhỏ sẽ có một tham chiếu từ node (đường A) đến node trong tile lớn (xa lộ F). Xem ví dụ về các routing tile có kích thước khác nhau trong Hình 3.6.

![Hình 3.6: Routing tile có kích thước khác nhau](../../images/v2/chapter03/Figure3.6.png)  
[Hình 3.6: Routing tile có kích thước khác nhau]

### Ước tính sơ bộ
Bây giờ chúng ta đã hiểu những kiến thức nền tảng, hãy thực hiện một ước tính sơ bộ. Vì thiết kế tập trung vào thiết bị di động, mức sử dụng dữ liệu và mức tiêu thụ pin là hai yếu tố quan trọng cần cân nhắc.

Trước khi đi sâu vào phần ước tính, dưới đây là một số quy đổi giữa hệ đo lường Anh và hệ mét để tham khảo.

*   1 foot = 0.3048 mét
*   1 kilomet (km) = 0.6214 dặm
*   1 kilomet = 1,000 mét

#### Mức sử dụng lưu trữ
Chúng ta cần lưu trữ ba loại dữ liệu.

*   **Bản đồ thế giới:** Chi tiết được tính như bên dưới.
*   **Metadata:** Vì dữ liệu của mỗi map tile không đáng kể, chúng ta có thể bỏ qua metadata trong phép tính.
*   **Thông tin đường:** Người phỏng vấn cho biết có dữ liệu đường thô ở quy mô TB từ các nguồn bên ngoài. Chúng ta chuyển đổi các tập dữ liệu này thành routing tile, và kích thước của các tile này cũng có thể ở quy mô TB.

#### Bản đồ thế giới
Chúng ta đã thảo luận về khái niệm map tile trong phần "Map 101" ở trang 60. Có nhiều tập map tile, mỗi tập tương ứng với một cấp độ zoom. Để hiểu lượng lưu trữ cần cho toàn bộ tập ảnh map tile, việc ước tính kích thước của tập tile lớn nhất ở cấp độ zoom cao nhất sẽ rất hữu ích. Trước hết, giả sử có 21 cấp độ zoom và cấp độ cao nhất là 21. Ở đó có khoảng 4.4 nghìn tỷ tile (Bảng 3.1). Giả sử mỗi tile là một ảnh PNG nén 256 x 256 pixel, có kích thước khoảng 100KB. Toàn bộ tập ở cấp độ zoom cao nhất sẽ cần khoảng 4.4 nghìn tỷ x 100KB = 440PB.

Trong Bảng 3.1, chúng ta trình bày sự tăng dần số lượng tile ở mỗi cấp độ zoom.

| Cấp độ zoom (Zoom) | Số lượng tile (Number of Tiles) |
| :------------- | :----------------------- |
| 0              | 1                        |
| 1              | 4                        |
| 2              | 16                       |
| 3              | 64                       |
| 4              | 256                      |
| 5              | 1 024                    |
| 6              | 4 096                    |
| 7              | 16 384                   |
| 8              | 65 536                   |
| 9              | 262 144                  |
| 10             | 1 048 576                |
| 11             | 4 194 304                |
| 12             | 16 777 216               |
| 13             | 67 108 864               |
| 14             | 268 435 456              |
| 15             | 1 073 741 824            |
| 16             | 4 294 967 296            |
| 17             | 17 179 869 184           |
| 18             | 68 719 476 736           |
| 19             | 274 877 906 944          |
| 20             | 1 099 511 627 776        |
| 21             | 4 398 046 511 104        |
**Bảng 3.1: Cấp độ zoom**

Tuy nhiên, hãy nhớ rằng khoảng 90% bề mặt Trái Đất là tự nhiên, phần lớn là các khu vực không có người ở như đại dương, sa mạc, hồ và núi. Vì các khu vực này có thể nén ảnh rất tốt, chúng ta có thể thận trọng giảm ước tính lưu trữ từ 80 ~ 90%. Kích thước lưu trữ khi đó sẽ giảm còn 44 đến 88PB. Chúng ta chọn giá trị ở giữa là 50PB.

Tiếp theo, hãy ước tính lượng lưu trữ mà mỗi cấp độ zoom thấp hơn sẽ chiếm. Ở mỗi cấp độ zoom thấp hơn, số tile theo hướng bắc-nam và đông-tây đều giảm một nửa. Điều này làm tổng số tile giảm 4 lần, nên kích thước lưu trữ của cấp độ zoom cũng giảm 4 lần. Với mỗi cấp độ zoom thấp hơn, công thức tính tổng kích thước là: `50 + 50/4 + 50/16 + ... ≈ 67PB`. Đây chỉ là một ước tính sơ bộ. Chỉ cần biết rằng chúng ta cần khoảng 100PB để lưu trữ các map tile ở mọi cấp độ zoom khác nhau.

#### Throughput của server
Để ước tính throughput của server, hãy xem lại các loại request mà chúng ta cần hỗ trợ. Có hai loại request chính. Loại đầu tiên là request điều hướng, được client gửi để bắt đầu một phiên điều hướng. Loại thứ hai là request cập nhật vị trí, được client gửi khi người dùng di chuyển trong phiên điều hướng. Dữ liệu vị trí được các downstream service sử dụng theo nhiều cách khác nhau. Ví dụ, dữ liệu vị trí được dùng cho dữ liệu giao thông theo thời gian thực. Chúng ta sẽ giới thiệu các trường hợp sử dụng dữ liệu vị trí trong phần đi sâu vào thiết kế.

Bây giờ chúng ta có thể phân tích throughput của server đối với request điều hướng. Giả sử có 1 tỷ DAU, mỗi người dùng sử dụng điều hướng trung bình tổng cộng 35 phút mỗi tuần, tương đương 5 tỷ phút mỗi tuần.

Một cách đơn giản là gửi tọa độ GPS mỗi giây. Cách này sẽ tạo ra 300 tỷ request mỗi giây (5 tỷ phút x 60), hay 3 triệu QPS (`300 tỷ request / 10^5 giây = 3 triệu`). Tuy nhiên, client có thể không cần gửi cập nhật GPS mỗi giây. Chúng ta có thể batch các cập nhật vị trí trên client rồi gửi ở tần suất thấp hơn, chẳng hạn mỗi 15 hoặc 30 giây, để giảm write QPS. Tần suất thực tế có thể phụ thuộc vào các yếu tố như tốc độ di chuyển của người dùng. Nếu người dùng đang kẹt xe, client có thể giảm tần suất cập nhật GPS. Trong thiết kế này, giả sử các cập nhật GPS được batch và gửi mỗi 15 giây. Với giả định đó, QPS giảm xuống còn 200,000 (`3 triệu / 15`).
Giả sử peak QPS bằng 5 lần mức trung bình. Peak QPS của cập nhật vị trí = `200,000 x 5 = 1 triệu`.

## Bước 2 - Đề xuất thiết kế cấp cao và nhận phê duyệt

Bây giờ chúng ta đã hiểu rõ hơn về Google Maps và sẵn sàng đề xuất một thiết kế cấp cao (Hình 3.7).

### Thiết kế cấp cao
![Hình 3.7: Thiết kế cấp cao](../../images/v2/chapter03/Figure3.7.png)  
[Hình 3.7: Thiết kế cấp cao]  
Người dùng di động -> CDN (ảnh bản đồ được tính toán trước (origin))
Người dùng di động -> load balancer
Load balancer -> dịch vụ điều hướng -> database geocoding (Geocoding DB)
Load balancer -> dịch vụ điều hướng -> routing tile (object storage)
Load balancer -> dịch vụ vị trí -> database vị trí người dùng (User Location DB)

Thiết kế cấp cao hỗ trợ ba tính năng. Hãy xem xét từng tính năng.

1.  Dịch vụ vị trí
2.  Dịch vụ điều hướng
3.  Kết xuất bản đồ

### Dịch vụ vị trí

Dịch vụ vị trí chịu trách nhiệm ghi nhận các cập nhật vị trí của người dùng. Kiến trúc được thể hiện trong Hình 3.8.

![Hình 3.8: Dịch vụ vị trí](../../images/v2/chapter03/Figure3.8.png)  
[Hình 3.8: Dịch vụ vị trí]  
Người dùng di động -> load balancer -> dịch vụ vị trí -> database vị trí người dùng

Thiết kế cơ bản yêu cầu client gửi cập nhật vị trí sau mỗi *t* giây, trong đó *t* là một khoảng thời gian có thể cấu hình. Cập nhật định kỳ có một số lợi ích. Thứ nhất, chúng ta có thể tận dụng stream dữ liệu vị trí để cải thiện hệ thống theo thời gian. Chúng ta có thể dùng dữ liệu này để giám sát giao thông theo thời gian thực, phát hiện đường mới hoặc đường bị đóng, và phân tích hành vi người dùng để cá nhân hóa, chẳng hạn. Thứ hai, chúng ta có thể tận dụng dữ liệu vị trí để cung cấp ETA chính xác hơn và gần như theo thời gian thực cho người dùng khi cần, đồng thời lập lại lộ trình.

Nhưng có thật sự cần gửi ngay mọi cập nhật vị trí đến server không? Câu trả lời có lẽ là không. Lịch sử vị trí có thể được buffer trên client rồi batch và gửi đến server ở tần suất thấp hơn. Ví dụ, như trong Hình 3.9, cập nhật vị trí được ghi nhận mỗi giây nhưng chỉ được gửi đến server như một phần của một batch mỗi 15 giây. Điều này làm giảm đáng kể tổng lưu lượng cập nhật gửi từ tất cả client.

![Hình 3.9: Request theo batch](../../images/v2/chapter03/Figure3.9.png)  
[Hình 3.9: Request theo batch]  
(Trục thời gian hiển thị một batch chứa nhiều bản ghi vị trí được gửi mỗi 15 giây)
Batch 3 (loc 45, ...) --- 15s --- Batch 2 (loc 32, loc 31, loc 30, ..., loc 17, loc 16) --- 15s --- Batch 1 (loc 15, ..., loc 2, loc 1)

Đối với một hệ thống như Google Maps, ngay cả khi cập nhật vị trí được batch, lượng ghi vẫn rất lớn. Chúng ta cần một database được tối ưu cho lượng ghi cao và khả năng mở rộng cao, chẳng hạn Cassandra. Chúng ta cũng có thể cần ghi dữ liệu vị trí vào một stream processing engine như Kafka để xử lý thêm. Chúng ta sẽ thảo luận vấn đề này trong phần đi sâu vào thiết kế.

Giao thức giao tiếp nào có thể là lựa chọn phù hợp? HTTP với tùy chọn keep-alive [10] có thể là một lựa chọn tốt vì nó rất hiệu quả. HTTP request có thể trông như sau:

`POST /v1/locations`
Tham số
`locs`: Mảng các tuple (vĩ độ, kinh độ, timestamp) được mã hóa bằng JSON.

### Dịch vụ điều hướng

Component này chịu trách nhiệm tìm một lộ trình nhanh hợp lý từ điểm A đến điểm B. Chúng ta có thể chấp nhận một chút latency. Lộ trình được tính không nhất thiết phải nhanh nhất, nhưng độ chính xác là yếu tố quan trọng nhất.

Như trong Hình 3.7 (ghi chú của dịch giả: bản gốc ghi 3.8 ở đây, nhưng theo ngữ cảnh phải là hình thiết kế cấp cao 3.7), người dùng gửi HTTP request đến dịch vụ điều hướng thông qua load balancer. Request bao gồm điểm bắt đầu và điểm kết thúc dưới dạng tham số. API có thể trông như sau:

`GET /v1/nav?origin=1355+market+street,SF&destination=Disneyland`

Kết quả của request điều hướng có thể như sau:

```json
{
  "distance": { "text": "0.2 mi", "value": 259 },
  "duration": { "text": "1 min", "value": 83 },
  "end_location": { "lat": 37.4038943, "lng": -121.9410454 },
  "html_instructions": "Head <b>northeast</b> on <b>Brandon St</b> toward <b>Alum Rock Ave</b><div style=\"font-size:0.9em\">Restricted usage road</div>",
  "polyline": { "points": "_fhcFjbngVuAWsDsCal"},
  "start_location": { "lat": 37.4027166, "lng": -121.9435889 },
  "geocoded_waypoints": [ {
      "geocoder_status": "OK",
      "partial_match": true,
      "place_id": "ChIJmt1fawWR02aVVVX2Ykg",
      "types": [ "locality", "political" ]
    }, {
      "geocoder_status": "OK",
      "partial_match": true,
      "place_id": "ChIJa3ApQG6tXawRLYeiBMUi7bM",
      "types": [ "locality", "political" ]
    } ],
  "travel_mode": "DRIVING"
}
```

Tham khảo [11] để biết thêm chi tiết về API chính thức của Google Maps.

Cho đến lúc này, chúng ta chưa xét đến giao thông theo thời gian thực và thay đổi lộ trình. Các vấn đề này được giải quyết bởi dịch vụ ETA thích ứng, sẽ được thảo luận trong phần đi sâu vào thiết kế.

### Kết xuất bản đồ

Như đã thảo luận trong phần ước tính sơ bộ, toàn bộ tập map tile ở nhiều cấp độ zoom có kích thước khoảng vài trăm PB. Việc lưu toàn bộ tập dữ liệu trên server để client lấy theo nhu cầu dựa trên vị trí hiện tại và cấp độ zoom của viewport client là không thực tế.

Khi nào client nên lấy map tile mới từ server? Dưới đây là một số trường hợp:

*   Người dùng đang zoom và pan viewport bản đồ để khám phá khu vực xung quanh.
*   Trong khi điều hướng, người dùng đi ra khỏi map tile hiện tại và bước vào tile lân cận.

Chúng ta đang xử lý một lượng dữ liệu rất lớn. Hãy xem cách cung cấp map tile hiệu quả cho client.

#### Phương án 1
Server xây dựng map tile động dựa trên vị trí của client và cấp độ zoom của viewport client. Vì số lượng tổ hợp vị trí và cấp độ zoom là vô hạn, việc tạo map tile động có một số nhược điểm nghiêm trọng:

*   Nó tạo ra tải rất lớn cho cụm server vì phải tạo động từng map tile.
*   Vì map tile được tạo động nên khó tận dụng cache.

#### Phương án 2
Một phương án khác là tạo trước một tập map tile tĩnh cho mỗi cấp độ zoom. Map tile là tĩnh, mỗi tile bao phủ một lưới hình chữ nhật cố định bằng một scheme phân vùng như geohashing. Vì vậy, mỗi tile được biểu diễn bằng geohash của nó. Nói cách khác, mỗi lưới có một geohash duy nhất tương ứng. Khi client cần map tile, trước tiên nó xác định tập map tile cần dùng dựa trên cấp độ zoom. Sau đó, client tính URL của map tile bằng cách chuyển vị trí của mình thành geohash ở cấp độ zoom phù hợp.
Các ảnh tĩnh được tạo trước này được phân phối qua CDN, như trong Hình 3.10.


![Hình 3.10: Ảnh được tạo trước phân phối qua CDN](../../images/v2/chapter03/Figure3.10.png)  
[Hình 3.10: Ảnh được tạo trước phân phối qua CDN]  
Người dùng di động -> CDN -> ảnh bản đồ được tính toán trước (origin)

Trong hình trên, người dùng di động gửi HTTP request để lấy tile từ CDN. Nếu CDN chưa có tile cụ thể đó, CDN lấy một bản sao từ origin server, cache cục bộ rồi trả về cho người dùng. Với các request tiếp theo, kể cả khi đến từ người dùng khác, CDN trả về bản sao đã cache mà không cần liên hệ với origin server.

Phương pháp này có khả năng mở rộng và hiệu năng tốt hơn vì map tile được phân phối từ điểm hiện diện (POP) gần nhất, như trong Hình 3.11. Tính chất tĩnh của map tile khiến chúng có khả năng cache rất cao.

![Hình 3.11: Có CDN so với không có CDN](../../images/v2/chapter03/Figure3.11.png)  
[Hình 3.11: Có CDN so với không có CDN]  
Không có CDN: server <-- 300 ms --> người dùng
Có CDN:
Người dùng <-- 10 ms --> POP
POP <-- ... --> POP
POP <-- ... --> origin server
POP <-- ... --> POP

Việc giữ mức sử dụng dữ liệu di động ở mức thấp rất quan trọng. Hãy tính lượng dữ liệu client cần tải trong một phiên điều hướng điển hình. Lưu ý rằng phép tính dưới đây không xét đến cache trên client. Vì người dùng có thể đi các tuyến tương tự nhau mỗi ngày, mức sử dụng dữ liệu khi có client cache có thể thấp hơn đáng kể.

#### Mức sử dụng dữ liệu
Giả sử người dùng di chuyển với tốc độ 30km/h và ở một cấp độ zoom nào đó, mỗi ảnh bao phủ một khu vực 200m x 200m (một khu vực được biểu diễn bằng 256 pixel, kích thước ảnh trung bình là 100KB). Với khu vực 1km x 1km, chúng ta cần 25 ảnh hoặc 2.5MB dữ liệu (`25 x 100KB`). Vì vậy, nếu tốc độ là 30km/h, chúng ta cần 75MB (`30 x 2.5MB`) dữ liệu mỗi giờ, hay 1.25MB mỗi phút.

Tiếp theo, hãy ước tính mức sử dụng dữ liệu CDN. Ở quy mô của chúng ta, chi phí là một yếu tố quan trọng cần cân nhắc.

#### Traffic qua CDN
Như đã nói, mỗi ngày chúng ta cung cấp 5 tỷ phút điều hướng. Điều này tương đương 5 tỷ x 1.25MB = 6.25 PB dữ liệu bản đồ mỗi ngày. Vì vậy, mỗi giây chúng ta cần cung cấp 62,500MB (`6.25 PB / 10^5 giây`) dữ liệu. Các ảnh bản đồ này được phân phối từ các POP trên toàn thế giới. Giả sử có 200 POP. Mỗi POP chỉ cần cung cấp vài trăm MB mỗi giây (`62,500 / 200`).

Trong thiết kế kết xuất bản đồ, còn một chi tiết cuối cùng mà chúng ta mới chỉ chạm đến. Client làm thế nào biết URL nào cần dùng để lấy map tile từ CDN? Hãy nhớ rằng khi sử dụng phương án 2, map tile là tĩnh và được tạo trước dựa trên các tập lưới cố định, mỗi tập đại diện cho một cấp độ zoom rời rạc.

Vì các lưới dựa trên geohash và mỗi lưới có một geohash duy nhất, client có thể tính geohash rất hiệu quả (cho map tile). Việc tính toán này có thể thực hiện trên client, sau đó chúng ta lấy ảnh tile tĩnh từ CDN. Ví dụ, URL của ảnh tile tại trụ sở Google có thể trông như sau: `https://cdn.map-provider.com/tiles/9q9hvu.png`

Xem chương 1, dịch vụ lân cận, ở trang 10 để biết thêm chi tiết về mã hóa geohash.

Tính geohash trên client có vẻ sẽ hoạt động tốt. Tuy nhiên, hãy nhớ rằng thuật toán này được hard-code trên tất cả nền tảng của mọi client. Việc phát hành thay đổi cho ứng dụng di động là một quy trình tốn thời gian và nhiều rủi ro. Chúng ta phải chắc chắn rằng phương pháp này hiệu quả. Nếu dự định sử dụng lâu dài cách mã hóa này để lấy map tile và khả năng thay đổi nó là thấp, thì đây là lựa chọn phù hợp. Nếu cần chuyển sang một phương pháp mã hóa khác, rủi ro sẽ thấp.

Cũng có một lựa chọn khác đáng cân nhắc. Thay vì dùng thuật toán hard-code trên client để chuyển cặp vĩ độ/kinh độ và cấp độ zoom thành URL tile, chúng ta có thể đưa vào một service trung gian có nhiệm vụ xây dựng URL tile dựa trên cùng các input. Đây là một service rất đơn giản. Sự linh hoạt vận hành tăng thêm có thể xứng đáng với chi phí này. Có thể thảo luận trade-off rất thú vị này với người phỏng vấn. Một quy trình kết xuất bản đồ khác được thể hiện trong Hình 3.12.
Khi người dùng di chuyển đến vị trí mới hoặc cấp độ zoom mới, map tile service xác định những tile cần thiết và chuyển thông tin đó thành một tập URL tile cần lấy.

![Hình 3.12: Kết xuất bản đồ](../../images/v2/chapter03/Figure3.12.png)  
[Hình 3.12: Kết xuất bản đồ]  
Người dùng di động --(1) lấy URL tile --> load balancer --(2) chuyển tiếp request --> map tile service --(3) xây dựng URL tile --> load balancer -> người dùng di động --(4) tải tile --> CDN

1.  Người dùng di động gọi map tile service để lấy URL tile. Request được gửi đến load balancer.
2.  Load balancer chuyển tiếp request đến map tile service.
3.  Map tile service nhận vị trí và cấp độ zoom của client làm input, rồi trả về 9 URL, bao gồm tile cần kết xuất và tám tile xung quanh.
4.  Client di động tải tile từ CDN.

Chúng ta sẽ giới thiệu chi tiết hơn về map tile được tính toán trước trong phần đi sâu vào thiết kế.

## Bước 3 - Đi sâu vào thiết kế

Trong phần này, chúng ta sẽ thảo luận về data model. Sau đó, chúng ta sẽ trình bày chi tiết hơn về dịch vụ vị trí, dịch vụ điều hướng và kết xuất bản đồ.

### Data model

Chúng ta xử lý bốn loại dữ liệu: routing tile, dữ liệu vị trí người dùng, dữ liệu geocoding và bản đồ thế giới được tính toán trước.

#### Routing tile
Như đã đề cập, tập dữ liệu đường ban đầu đến từ nhiều nguồn và cơ quan có thẩm quyền khác nhau. Nó chứa dữ liệu thô ở quy mô TB. Tập dữ liệu liên tục được cải thiện nhờ dữ liệu vị trí thu thập từ người dùng trong quá trình họ sử dụng ứng dụng.

Tập dữ liệu này chứa rất nhiều đường và metadata liên quan, chẳng hạn như tên, quận, kinh độ và vĩ độ. Dữ liệu chưa được tổ chức thành cấu trúc dữ liệu graph và không phù hợp với hầu hết thuật toán định tuyến. Chúng ta chạy một offline processing pipeline định kỳ, gọi là routing tile processing service, để chuyển đổi tập dữ liệu này thành routing tile như đã giới thiệu. Service này chạy định kỳ để nắm bắt các thay đổi mới nhất của dữ liệu đường.

Output của routing tile processing service là routing tile. Có ba nhóm tile với các độ phân giải khác nhau, như đã mô tả trong phần "Map 101" ở trang 60. Mỗi tile chứa danh sách node và edge của graph đại diện cho các giao lộ và đường trong khu vực mà tile bao phủ. Nó cũng chứa tham chiếu đến tất cả tile khác kết nối với mình. Các tile này cùng tạo thành một mạng lưới đường liên kết mà thuật toán định tuyến có thể sử dụng từng phần.

Routing tile processing service lưu các tile này ở đâu? Phần lớn dữ liệu graph được biểu diễn trong bộ nhớ dưới dạng adjacency table [12] hoặc adjacency list [13]. Để giữ cho tile nhỏ nhất có thể nhằm giảm lưu trữ và truyền qua network, chúng ta chỉ lưu node và edge dưới dạng các row trong database, và giả định rằng cần có cách serialize adjacency list thành file nhị phân. Chúng ta có thể dùng wrapper phần mềm hiệu năng cao như Protocol Buffers để serialize các tile vào object storage. Cách này cung cấp một cơ chế nhanh để tra cứu tile trong object storage thông qua cặp geohash/ing.

Chúng ta sẽ thảo luận sau về cách shortest-path service sử dụng các routing tile này.

#### Dữ liệu vị trí người dùng
Dữ liệu vị trí người dùng rất có giá trị. Chúng ta dùng nó để cập nhật dữ liệu định tuyến và routing tile. Chúng ta cũng dùng nó để xây dựng dữ liệu giao thông theo thời gian thực và dữ liệu lịch sử. Ngoài ra, chúng ta dùng nó để cập nhật dữ liệu bản đồ thông qua nhiều data stream processing service.

Đối với dữ liệu vị trí người dùng, chúng ta cần một database có khả năng xử lý tốt workload thiên về ghi và có thể scale theo chiều ngang. Cassandra có thể là một lựa chọn tốt.

Một row có thể trông như sau:

| user_id | timestamp  | user_mode | driving_mode | location   |
| :------ | :--------- | :-------- | :----------- | :--------- |
| 101     | 1635740977 | active    | driving      | (20.0, 30.5) |
**Bảng 3.2: Bảng vị trí**

#### Dữ liệu geocoding
Database này lưu địa điểm và cặp vĩ độ/kinh độ tương ứng. Chúng ta có thể dùng key-value database như Redis để đọc nhanh, vì tần suất đọc cao còn tần suất ghi thấp. Nó được dùng để chuyển điểm bắt đầu hoặc điểm kết thúc thành cặp vĩ độ/kinh độ trước khi đưa vào route planner.

#### Ảnh được tính toán trước của bản đồ thế giới
Khi thiết bị yêu cầu một khu vực cụ thể trên bản đồ, chúng ta cần lấy các đường lân cận và tính toán một ảnh đại diện cho khu vực đó cùng tất cả đường và chi tiết liên quan. Các phép tính này nặng và dư thừa, nên việc tính toán trước rồi cache ảnh có thể hữu ích. Chúng ta tính toán trước ảnh ở các cấp độ zoom khác nhau và lưu chúng trong cloud storage như Amazon S3, được CDN hỗ trợ. Đây là một ảnh ví dụ:

![Hình 3.13: Tile được tính toán trước](../../images/v2/chapter03/Figure3.13.png)  
[Hình 3.13: Tile được tính toán trước]  
Các map tile lấy từ Stamen Design, theo giấy phép CC BY 3.0. Dữ liệu do các contributor của OpenStreetMap cung cấp.

### Service

Bây giờ chúng ta đã thảo luận về data model, hãy xem kỹ một số service quan trọng nhất: dịch vụ vị trí, dịch vụ kết xuất bản đồ và dịch vụ điều hướng.

#### Dịch vụ vị trí
Trong thiết kế cấp cao, chúng ta đã thảo luận cách dịch vụ vị trí hoạt động. Trong phần này, chúng ta tập trung vào thiết kế database của service và cách sử dụng dữ liệu vị trí người dùng.

Trong Hình 3.14, key-value store được dùng để lưu dữ liệu vị trí người dùng. Hãy xem kỹ hơn.

![Hình 3.14: Database vị trí người dùng](../../images/v2/chapter03/Figure3.14.png)  
[Hình 3.14: Database vị trí người dùng]  
Người dùng di động -> load balancer -> dịch vụ vị trí -> database vị trí người dùng

Với 1 triệu cập nhật vị trí mỗi giây, chúng ta cần một database hỗ trợ ghi nhanh. NoSQL key-value database hoặc column-oriented database sẽ là một lựa chọn tốt. Ngoài ra, vị trí của người dùng liên tục thay đổi và nhanh chóng trở nên lỗi thời. Vì vậy, chúng ta ưu tiên availability hơn consistency. Định lý CAP [13] chỉ ra rằng có thể chọn hai trong ba thuộc tính consistency, availability và partition tolerance. Với các ràng buộc của chúng ta, chúng ta sẽ chọn availability và partition tolerance. Một database có bảo đảm availability mạnh là lựa chọn tốt, chẳng hạn Cassandra. Nó có thể xử lý quy mô của chúng ta và có bảo đảm availability mạnh.

Key là tổ hợp `(user_id, timestamp)`, còn value là cặp vĩ độ/kinh độ. Trong thiết lập này, `user_id` là partition key và `timestamp` là clustering key. Ưu điểm của việc dùng `user_id` làm partition key là có thể nhanh chóng đọc vị trí mới nhất của một người dùng cụ thể. Toàn bộ dữ liệu của một người dùng được lưu trong cùng một partition key và được sắp xếp theo `timestamp`. Với cách sắp xếp này, việc lấy dữ liệu vị trí của một người dùng cụ thể trong một khoảng thời gian rất hiệu quả.

Bảng có thể trông như sau:

| key (user_id) | timestamp | lat  | long | user_mode | navigation_mode |
| :------------ | :-------- | :--- | :--- | :-------- | :-------------- |
| 51            | 132053000 | 21.9 | 89.8 | active    | driving         |
**Bảng 3.3: Dữ liệu vị trí**

#### Chúng ta sử dụng dữ liệu vị trí người dùng như thế nào?
Dữ liệu vị trí người dùng rất quan trọng. Nó hỗ trợ nhiều use case. Chúng ta dùng dữ liệu này để phát hiện đường mới và đường bị đóng. Đây cũng là một trong các input để cải thiện độ chính xác của bản đồ theo thời gian. Dữ liệu này cũng được dùng cho giao thông theo thời gian thực.

Để hỗ trợ các use case này, ngoài việc ghi vị trí hiện tại của người dùng vào database, chúng ta ghi thông tin này vào một message queue như Kafka. Kafka là một nền tảng data stream thống nhất, độ trễ thấp và throughput cao, được thiết kế cho các feed dữ liệu theo thời gian thực. Hình 3.15 cho thấy việc sử dụng Kafka trong thiết kế được cải thiện.

![Hình 3.15: Dữ liệu vị trí được các service khác sử dụng](../../images/v2/chapter03/Figure3.15.png)  
[Hình 3.15: Dữ liệu vị trí được các service khác sử dụng]  
Người dùng di động -> load balancer -> dịch vụ vị trí -> database vị trí người dùng
Dịch vụ vị trí -> Kafka
Kafka -> dịch vụ cập nhật giao thông -> database giao thông
Kafka -> dịch vụ machine learning & cá nhân hóa -> database cá nhân hóa
Kafka -> dịch vụ xử lý routing tile -> routing tile (object storage)
Kafka -> phân tích -> database phân tích

Các service khác consume stream dữ liệu vị trí từ Kafka cho nhiều use case. Ví dụ, dịch vụ giao thông theo thời gian thực consume stream rồi cập nhật database giao thông theo thời gian thực. Routing tile processing service tận dụng stream để cải thiện bản đồ bằng cách phát hiện đường mới hoặc đường bị đóng và cập nhật các routing tile bị ảnh hưởng. Các service khác cũng có thể kết nối vào stream cho những mục đích khác nhau.

#### Kết xuất bản đồ
Trong phần này, chúng ta sẽ đi sâu vào các map tile được tính toán trước và tối ưu hóa kết xuất bản đồ. Những nội dung này chủ yếu lấy cảm hứng từ công trình thiết kế của Google [3].

#### Tile được tính toán trước
Như đã đề cập, có nhiều tập map tile được tính toán trước, cung cấp mức độ chi tiết bản đồ phù hợp ở các cấp độ zoom khác nhau dựa trên kích thước viewport và cấp độ zoom của client. Google Maps sử dụng 21 cấp độ zoom (Bảng 3.1). Chúng ta cũng sẽ làm như vậy.

Cấp độ 0 là cấp độ thu nhỏ nhất. Toàn bộ bản đồ được biểu diễn bằng một tile 256 x 256 pixel duy nhất.

Sau mỗi lần tăng cấp độ zoom, số lượng map tile tăng gấp đôi theo cả hướng bắc-nam và đông-tây. Như Hình 3.16 minh họa, ở cấp độ zoom 1 có 2 x 2 = 4 tile, với độ phân giải tổng cộng là 512 x 512 pixel. Ở cấp độ zoom 2 có 4 x 4 = 16 tile, với độ phân giải tổng cộng là 1024 x 1024 pixel. Sau mỗi lần tăng, số pixel của toàn bộ tập tile tăng 4 lần so với cấp trước. Số pixel tăng thêm cung cấp cho người dùng mức độ chi tiết cao hơn. Điều này cho phép client kết xuất bản đồ ở mức độ chi tiết tối ưu mà không cần tải quá nhiều tile về viewport và cấp độ zoom của client.

![Hình 3.16: Cấp độ zoom](../../images/v2/chapter03/Figure3.16.png)  
[Hình 3.16: Cấp độ zoom]  
Cấp độ zoom 0 (256px)
01 11
00 10
Cấp độ zoom 1 (512px)
0101 0111 1101 1111
0100 0110 1100 1110
0001 0011 1001 1011
0000 0010 1000 1010
Cấp độ zoom 2 (1024px)
(lưới được chia chi tiết hơn)
Các map tile lấy từ Stamen Design, theo giấy phép CC BY 3.0. Dữ liệu do các contributor của OpenStreetMap cung cấp.

#### Tối ưu hóa: sử dụng vector
Với sự phát triển và triển khai của WebGL, một cải tiến tiềm năng là thay đổi thiết kế từ gửi ảnh (raster tile) sang gửi thông tin vector (path và polygon). Client vẽ path và polygon từ thông tin vector.

Một ưu điểm rõ ràng của vector tile là dữ liệu vector nén tốt hơn nhiều so với ảnh. Mức tiết kiệm băng thông là đáng kể.

Một ưu điểm ít rõ ràng hơn là vector tile mang lại trải nghiệm zoom tốt hơn. Với ảnh raster, khi client zoom từ cấp độ này sang cấp độ khác, mọi thứ sẽ trở nên mờ cho đến khi tile mới được tải xong.

#### Dịch vụ điều hướng (tiếp theo)
Hãy quay lại với dịch vụ điều hướng. Hình 3.17 cho thấy dịch vụ điều hướng và các dependency của nó.

![Hình 3.17: Dịch vụ điều hướng](../../images/v2/chapter03/Figure3.17.png)    
[Hình 3.17: Dịch vụ điều hướng]  
Dịch vụ điều hướng -> dịch vụ geocoding
Dịch vụ điều hướng -> dịch vụ route planner
Dịch vụ route planner -> dịch vụ shortest path
Dịch vụ route planner -> dịch vụ ETA
Dịch vụ route planner -> dịch vụ ranker
Dịch vụ shortest path -> dịch vụ filter
Dịch vụ shortest path -> routing tile
Dịch vụ ETA -> database giao thông
Dịch vụ ETA -> ETA thích ứng và re-route
ETA thích ứng và re-route -> database người dùng đang hoạt động

#### Dịch vụ geocoding
Service này chuyển địa chỉ mà con người có thể đọc được thành tọa độ địa lý (cặp vĩ độ/kinh độ). Theo chiều ngược lại, nó chuyển tọa độ địa lý thành địa chỉ.

#### Dịch vụ route planner
Đây là component cốt lõi của dịch vụ điều hướng. Nó tương tác với nhiều downstream service để tìm lộ trình tốt nhất.

#### Dịch vụ shortest path
Dịch vụ shortest path nhận cặp vĩ độ/kinh độ của điểm bắt đầu và điểm kết thúc, rồi trả về k lộ trình ngắn nhất có xét đến giao thông hoặc tình trạng hiện tại. Phép tính này phụ thuộc vào cấu trúc của các con đường. Ở đây, cache lộ trình có thể hữu ích vì graph hiếm khi thay đổi.

Dịch vụ shortest path chạy một biến thể của thuật toán tìm đường A*, hoạt động trên routing tile trong object storage. Quy trình tổng quát như sau:

*   Thuật toán nhận cặp vĩ độ/kinh độ của điểm bắt đầu và điểm kết thúc. Cặp vĩ độ/kinh độ được chuyển thành geohash, sau đó dùng để tải routing tile ở điểm bắt đầu và điểm kết thúc của lộ trình.
*   Thuật toán bắt đầu từ routing tile ở điểm bắt đầu, duyệt cấu trúc dữ liệu graph và hydrate thêm các tile lân cận từ object storage (hoặc cache cục bộ nếu tile đã được tải) khi mở rộng vùng tìm kiếm. Nó nối các tile ở một cấp với các tile ở cấp khác bao phủ cùng khu vực. Đây là cách thuật toán có thể "đi vào" một tile lớn hơn chỉ chứa xa lộ, chẳng hạn. Thuật toán tiếp tục cho đến khi tìm thấy điểm kết thúc, cần hydrate thêm các tile lân cận (hoặc tile ở độ phân giải khác) để mở rộng cho đến khi tìm được một tập lộ trình tối ưu.

Hình 3.18 (dựa trên [14]) đưa ra một tổng quan khái niệm về các tile được sử dụng trong quá trình duyệt graph.

![Hình 3.18: Duyệt graph](../../images/v2/chapter03/Figure3.18.png)  
[Hình 3.18: Duyệt graph]  
Các map tile lấy từ Stamen Design, theo giấy phép CC BY 3.0. Dữ liệu do các contributor của OpenStreetMap cung cấp.

#### Dịch vụ ETA
Sau khi route planner nhận được danh sách các lộ trình khả dĩ gần nhất, nó gọi dịch vụ ETA cho từng lộ trình để lấy ước tính thời gian. Để làm việc này, dịch vụ ETA dùng machine learning để dự đoán ETA dựa trên dữ liệu giao thông hiện tại và lịch sử.

Thách thức dự đoán tình trạng giao thông trong 10 hoặc 20 phút tới cần được giải quyết ở một tầng thuật toán riêng và nằm ngoài phạm vi thảo luận này. Nếu quan tâm, hãy tham khảo [15] và [16].

#### Dịch vụ ranker (Ranker service)
Cuối cùng, sau khi route planner có dự đoán ETA, nó truyền thông tin này cho ranker để áp dụng các filter do người dùng định nghĩa. Một số filter ví dụ gồm tránh đường thu phí hoặc tránh xa lộ. Sau đó, ranker service xếp hạng các lộ trình từ nhanh nhất đến chậm nhất và trả về k kết quả đầu tiên cho dịch vụ điều hướng.

#### Dịch vụ updater (Updater services)
Các service này kết nối vào stream cập nhật vị trí từ Kafka và bất đồng bộ cập nhật một số database quan trọng để giữ chúng luôn mới. Database giao thông và routing tile là một số ví dụ.

Routing tile processing service chịu trách nhiệm chuyển đổi các tập dữ liệu đường có đường mới phát hiện và đường bị đóng thành tập routing tile được cập nhật liên tục. Điều này giúp dịch vụ shortest path chính xác hơn.

Dịch vụ cập nhật giao thông trích xuất tình trạng giao thông từ các cập nhật vị trí dạng stream của người dùng đang hoạt động. Thông tin này được đưa vào database giao thông theo thời gian thực. Nhờ đó, dịch vụ ETA có thể cung cấp các ước tính chính xác hơn.

#### Cải tiến: ETA thích ứng và re-route
Thiết kế hiện tại chưa hỗ trợ ETA thích ứng và re-route. Để giải quyết vấn đề này, server cần theo dõi người dùng đang điều hướng và cập nhật cho họ dựa trên thay đổi ETA. Bất cứ khi nào tình trạng giao thông thay đổi, chúng ta cần trả lời một số câu hỏi quan trọng:

*   Làm thế nào để theo dõi người dùng đang điều hướng?
*   Làm thế nào để lưu dữ liệu để có thể xác định hiệu quả những người dùng bị ảnh hưởng bởi thay đổi giao thông, chẳng hạn ùn tắc trên một routing tile cụ thể?

Hãy bắt đầu với một giải pháp đơn giản. Trong Hình 3.19, lộ trình điều hướng của user_1 được biểu diễn bằng các routing tile r_1, r_2, r_3, ..., r_7.

![Hình 3.19: Lộ trình điều hướng](../../images/v2/chapter03/Figure3.19.png)  
[Hình 3.19: Lộ trình điều hướng]  
r_1 (điểm bắt đầu) -> r_2 -> r_3 -> r_4 -> r_5 -> r_6 -> r_7 (đích)

Database lưu người dùng đang điều hướng và thông tin lộ trình có thể trông như sau:
`user_1: r_1, r_2, r_3, ..., r_k`
`user_2: r_4, r_6, r_9, ..., r_n`
`user_3: r_2, r_8, r_9, ..., r_m`
...
`user_n: r_2, r_10, r_21, ..., r_l`

Giả sử routing tile 2 (r_2) xảy ra sự cố giao thông. Để tìm ra những người dùng bị ảnh hưởng, chúng ta có thể quét từng row và kiểm tra routing tile 2 có nằm trong danh sách routing tile của người dùng hay không (xem ví dụ bên dưới):

`user_1: r_1, **r_2**, r_3, ..., r_k`
`user_2: r_4, r_6, r_9, ..., r_n`
`user_3: **r_2**, r_8, r_9, ..., r_m`
...
`user_n: **r_2**, r_10, r_21, ..., r_l`

Giả sử bảng có *n* row và độ dài trung bình của lộ trình là *m*. Độ phức tạp thời gian để tìm tất cả người dùng bị ảnh hưởng bởi thay đổi giao thông là O(n x m).

Chúng ta có thể làm quy trình này nhanh hơn không? Hãy khám phá một phương pháp khác. Với mỗi người dùng đang điều hướng, chúng ta lưu routing tile hiện tại, routing tile ở cấp độ phân giải tiếp theo chứa tile đó, rồi đệ quy cho đến cấp độ phân giải cao nhất trong file (Hình 3.20). Nhờ vậy, chúng ta có thể nhanh chóng lọc ra nhiều người dùng. Row trong bảng database có thể trông như sau:

`user_1, r_1, super(r_1), super(super(r_1)), ...`

![Hình 3.20: Xây dựng routing tile](../../images/v2/chapter03/Figure3.20.png)  
[Hình 3.20: Xây dựng routing tile]  
Routing tile này chỉ chứa điểm bắt đầu (Origin) -> O (Routing tile cấp 2)
Routing tile này chứa điểm bắt đầu và điểm kết thúc (Origin & Destination) -> O (Routing tile cấp 1)
Điểm kết thúc (Destination) -> O (Routing tile)

Để xác định người dùng có bị ảnh hưởng bởi thay đổi giao thông hay không, chúng ta chỉ cần kiểm tra routing tile cuối cùng trong một row của database có chứa routing tile đó hay không. Nếu không, người dùng không bị ảnh hưởng. Nếu có, người dùng bị ảnh hưởng. Nhờ vậy, chúng ta có thể nhanh chóng lọc bỏ nhiều người dùng.

Phương pháp này chưa nói rõ điều gì xảy ra khi giao thông thông thoáng trở lại. Ví dụ, nếu routing tile 2 được giải tỏa và người dùng có thể quay lại lộ trình cũ, làm thế nào người dùng biết có thể re-route? Một ý tưởng là theo dõi tất cả lộ trình thay thế khả dĩ và định kỳ tính lại ETA để thông báo cho người dùng khi có lộ trình mới.

#### Giao thức phân phối (Delivery protocols)
Trong quá trình điều hướng, tình trạng lộ trình có thể thay đổi và server cần một cách đáng tin cậy để push dữ liệu đến client di động. Với giao thức phân phối từ server đến client, các lựa chọn gồm mobile push notification, long polling, WebSocket và server-sent events (SSE).

*   Mobile push notification không phải lựa chọn tốt vì kích thước payload rất giới hạn (iOS là 4,096 byte) và không hỗ trợ ứng dụng web.
*   WebSocket thường được xem là tốt hơn long polling vì chi phí chiếm dụng trên server rất nhỏ.
*   Vì đã loại mobile push notification và long polling, lựa chọn chủ yếu còn lại là WebSocket và SSE. Dù cả hai đều có thể hoạt động, chúng ta vẫn nghiêng về WebSocket vì nó hỗ trợ giao tiếp hai chiều và các tính năng như delivery chặng cuối có thể cần giao tiếp hai chiều theo thời gian thực.

Để biết thêm chi tiết về ETA và re-route, hãy tham khảo [15].

Bây giờ chúng ta đã thiết kế xong mọi phần. Hãy xem thiết kế đã cập nhật trong Hình 3.21.

![Hình 3.21: Thiết kế cuối cùng](../../images/v2/chapter03/Figure3.21.png)  
[Hình 3.21: Thiết kế cuối cùng]  
Người dùng di động -> load balancer
Load balancer -> dịch vụ geocoding -> database geocoding
Load balancer -> dịch vụ điều hướng
Dịch vụ điều hướng -> dịch vụ route planner
Dịch vụ route planner -> dịch vụ shortest path -> routing tile (object storage)
Dịch vụ route planner -> dịch vụ ETA -> database giao thông
Dịch vụ route planner -> ranker
Dịch vụ shortest path -> dịch vụ filter (tránh trạm thu phí, ...)
Dịch vụ ETA -> ETA thích ứng và re-route -> database người dùng đang hoạt động
ETA thích ứng và re-route -> dịch vụ cập nhật giao thông -> database vị trí

## Bước 4 - Tóm tắt

Trong chương này, chúng ta đã thiết kế một phiên bản Google Maps đơn giản hóa với các tính năng chính như cập nhật vị trí, ETA, lập lộ trình và kết xuất bản đồ. Nếu muốn mở rộng hệ thống, một cải tiến tiềm năng là cung cấp tính năng điều hướng qua nhiều điểm dừng cho khách hàng doanh nghiệp. Ví dụ, với một tập điểm đến cho trước, chúng ta cần tìm thứ tự tối ưu để ghé thăm tất cả điểm đến và cung cấp điều hướng dựa trên tình trạng giao thông theo thời gian thực. Điều này sẽ hữu ích cho các dịch vụ giao hàng như DoorDash, Uber, Lyft, v.v.

Chúc mừng bạn đã đi đến đây! Bây giờ hãy tự động viên mình một chút. Làm tốt lắm!

## Tóm tắt chương

* **Google Maps (Google Maps)**
   * **Bước 1 (step 1)**
      * **Yêu cầu chức năng (functional req)**
         * Cập nhật vị trí người dùng (user location update)
         * Dịch vụ điều hướng (navigation service)
         * Kết xuất bản đồ (map rendering)
      * **Yêu cầu phi chức năng (non-functional req)**
         * Độ chính xác cao (highly accurate)
         * Điều hướng mượt mà (smooth navigation)
         * Mức sử dụng dữ liệu (data usage)
      * **Ước tính (estimation)**
         * Lưu trữ (storage)
         * Traffic của server (server traffic)
   * **Bước 2 (step 2)**
      * **Map 101 (map 101)**
         * Hệ tọa độ (positioning system)
         * Từ 3D sang 2D (going from 3d to 2d)
         * Geocoding (geocoding)
         * Geohashing (geohashing)
         * Routing tile (routing tiles)
      * **Thiết kế cấp cao (high-level design)**
         * Dịch vụ vị trí (location service)
         * Dịch vụ điều hướng (navigation service)
         * Kết xuất bản đồ (map rendering)
   * **Bước 3 (step 3)**
      * **Dữ liệu (data)**
         * Routing tile (routing tiles)
         * Vị trí người dùng (user location)
         * Địa điểm (places)
         * Ảnh được tính toán trước (precomputed images)
      * **Service (services)**
         * Dịch vụ vị trí (location service) -> Cách sử dụng dữ liệu vị trí (how location data is used)
         * Kết xuất bản đồ (rendering map)
            * Tile được tính toán trước (precomputed tiles)
            * Sử dụng vector (use vectors)
         * Dịch vụ điều hướng (navigation service)
            * Geocoding (geocoding)
            * Route planner (route planner)
            * Shortest path (shortest-path)
            * Dịch vụ ETA (ETA service)
            * ETA thích ứng và re-route (adaptive ETA and rerouting)
   * **Bước 4 (step 4)** -> Tóm tắt (wrap up)

## Tài liệu tham khảo

1.  Google Maps. https://developers.google.com/maps?hl=en_US.
2.  Nền tảng Google Maps. https://cloud.google.com/maps-platform/.
3.  Tạo nguyên mẫu bản đồ mượt hơn. https://medium.com/google-design/google-maps-cb0326d165f5.
4.  Phép chiếu Mercator. https://en.wikipedia.org/wiki/Mercator_projection.
5.  Phép chiếu hoa thị Peirce. https://en.wikipedia.org/wiki/Peirce_quincuncial_projection.
6.  Phép chiếu Gall-Peters. https://en.wikipedia.org/wiki/Gall–Peters_projection.
7.  Phép chiếu Winkel. https://en.wikipedia.org/wiki/Winkel_tripel_projection.
8.  Geocoding địa chỉ. https://en.wikipedia.org/wiki/Address_geocoding.
9.  Geohashing. https://kousiknath.medium.com/system-design-design-a-geo-spatial-index-for-real-time-location-search-10968fe62b9c.
10. HTTP keep-alive. https://en.wikipedia.org/wiki/HTTP_persistent_connection.
11. Directions API. https://developers.google.com/maps/documentation/directions/start?hl=en_US.
12. Adjacency list. https://en.wikipedia.org/wiki/Adjacency_list.
13. Định lý CAP. https://en.wikipedia.org/wiki/CAP_theorem.
14. Routing tile. https://valhalla.readthedocs.io/en/latest/mjolnir/why_tiles/.
15. ETA sử dụng GNN. https://deepmind.com/blog/article/traffic-prediction-with-advanced-graph-neural-networks.
16. Google Maps 101: AI giúp dự đoán giao thông và xác định lộ trình như thế nào. https://blog.google/products/maps/google-maps-101-how-ai-helps-predict-traffic-and-determine-routes/.
