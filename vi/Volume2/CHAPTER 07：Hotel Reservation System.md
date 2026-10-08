# Chương 7 Hệ thống đặt phòng khách sạn

Trong chương này, chúng ta sẽ thiết kế một hệ thống đặt phòng khách sạn, chẳng hạn như Marriott International. Thiết kế và công nghệ được sử dụng trong chương này cũng áp dụng cho các câu hỏi phỏng vấn phổ biến khác liên quan đến đặt chỗ:

*   Thiết kế Airbnb
*   Thiết kế hệ thống đặt vé máy bay
*   Thiết kế hệ thống đặt vé xem phim

## Bước 1 - Tìm hiểu vấn đề và xác định phạm vi thiết kế

Hệ thống đặt phòng khách sạn rất phức tạp, các thành phần của nó thay đổi tùy theo use case của doanh nghiệp. Trước khi đi sâu vào thiết kế, bạn nên hỏi interviewer các câu hỏi làm rõ để thu hẹp phạm vi.

**Ứng viên**: Quy mô của hệ thống lớn đến đâu?  
**Interviewer**: Hãy giả sử chúng ta đang xây dựng website cho một chuỗi khách sạn có 5.000 khách sạn, tổng cộng 1 triệu phòng.

**Ứng viên**: Khách hàng thanh toán khi đặt phòng hay khi đến khách sạn?  
**Interviewer**: Để đơn giản, họ thanh toán toàn bộ khi đặt phòng.

**Ứng viên**: Khách hàng chỉ đặt phòng qua website khách sạn thôi sao? Chúng ta có cần hỗ trợ các phương thức đặt phòng khác, chẳng hạn như đặt qua điện thoại, không?  
**Interviewer**: Hãy giả sử mọi người có thể đặt phòng qua website hoặc App của khách sạn.

**Ứng viên**: Khách hàng có thể hủy đặt phòng không?  
**Interviewer**: Có.

**Ứng viên**: Còn điều gì khác cần cân nhắc không?  
**Interviewer**: Có, chúng ta cho phép overbooking 10%. Nếu bạn chưa biết, overbooking có nghĩa là khách sạn bán số phòng nhiều hơn số phòng thực tế đang có. Khách sạn làm vậy vì dự đoán một phần khách hàng sẽ hủy đặt phòng.

**Ứng viên**: Vì thời gian có hạn, tôi giả định tìm kiếm khách sạn không nằm trong phạm vi. Chúng ta tập trung vào các chức năng sau:

*   Hiển thị các trang liên quan đến khách sạn.
*   Hiển thị các trang chi tiết liên quan đến phòng.
*   Đặt phòng.
*   Bảng quản trị phía sau để thêm/xóa/cập nhật thông tin khách sạn hoặc phòng.
*   Hỗ trợ chức năng overbooking.

**Interviewer**: Nghe ổn.

**Interviewer**: Còn một điều nữa, giá khách sạn thay đổi linh động. Giá phòng phụ thuộc vào công suất dự kiến của khách sạn vào một ngày nhất định. Trong buổi phỏng vấn này, chúng ta có thể giả định giá mỗi ngày có thể khác nhau.  
**Ứng viên**: Tôi sẽ ghi nhớ điều đó.

Tiếp theo, bạn có thể muốn trao đổi về những yêu cầu phi chức năng quan trọng nhất.

### Yêu cầu phi chức năng (Non-functional requirements)

*   Hỗ trợ concurrency cao. Trong mùa cao điểm hoặc thời gian diễn ra các sự kiện lớn, một số khách sạn phổ biến có thể có rất nhiều khách hàng cố gắng đặt cùng một phòng.
*   Latency vừa phải. Khi người dùng đặt phòng, tốt nhất là hệ thống phản hồi nhanh, nhưng việc hệ thống mất vài giây để xử lý request đặt phòng vẫn có thể chấp nhận được.

### Ước tính sơ bộ (Back-of-the-envelope estimation)

*   Tổng cộng 5.000 khách sạn và 1 triệu phòng.
*   Giả sử 70% số phòng đang được sử dụng, thời gian lưu trú trung bình là 3 ngày.
*   Số lượt đặt phòng ước tính mỗi ngày: (1 triệu × 0.7) / 3 = 233.333 (làm tròn lên thành ~240.000).
*   Số lượt đặt phòng mỗi giây = 240.000 / $10^5$ giây (một ngày khoảng $10^5$ giây) = ~3. Như chúng ta thấy, số transaction đặt phòng trung bình mỗi giây (TPS) không cao.

Tiếp theo, hãy tính sơ bộ QPS của tất cả các trang trong hệ thống. Quy trình điển hình của một khách hàng có ba bước:

1.  Xem trang chi tiết khách sạn/phòng. Người dùng duyệt trang này (query).
2.  Xem trang đặt phòng. Trước khi đặt phòng, người dùng xác nhận thông tin đặt phòng như ngày, số lượng khách và thông tin thanh toán (query).
3.  Đặt phòng. Người dùng nhấn nút “đặt phòng” để đặt phòng (transaction).

Hãy giả sử khoảng 10% người dùng sẽ chuyển sang bước tiếp theo, còn 90% người dùng rời đi trước khi đến bước cuối cùng. Chúng ta cũng có thể giả định chưa triển khai chức năng prefetch (tức là prefetch nội dung trước khi người dùng chuyển sang bước tiếp theo). Hình 1 thể hiện ước tính sơ bộ QPS của các bước khác nhau. Chúng ta biết TPS của các lượt đặt phòng cuối cùng là 3, vì vậy có thể suy ngược qua funnel. QPS của trang xác nhận đơn là 30, còn QPS của trang chi tiết là 300.

![Phân bố QPS của Hình 7.1](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.1.png)

Hình 1 Phân bố QPS

## Bước 2 - Đề xuất thiết kế cấp cao và nhận được sự đồng thuận

Trong phần này, chúng ta sẽ thảo luận về:

*   Thiết kế API
*   Mô hình dữ liệu
*   Thiết kế cấp cao

### Thiết kế API (API design)
Chúng ta sẽ tìm hiểu thiết kế API của hệ thống đặt phòng khách sạn. Các API cốt lõi được liệt kê dưới đây theo quy ước RESTful.

Lưu ý rằng chương này tập trung vào thiết kế hệ thống đặt phòng khách sạn. Với một website khách sạn hoàn chỉnh, thiết kế cần cung cấp cho khách hàng chức năng trực quan để tìm kiếm phòng theo nhiều tiêu chí. API cho các chức năng tìm kiếm này tuy quan trọng nhưng không có nhiều thách thức về mặt kỹ thuật. Chúng nằm ngoài phạm vi của chương này.

### Các API liên quan đến khách sạn (Hotel-related APIs)

| API | Chi tiết |
| :--- | :--- |
| GET /v1/hotels/ID | Lấy thông tin chi tiết của khách sạn. |
| POST /v1/hotels | Thêm khách sạn mới. API này chỉ dành cho nhân viên khách sạn. |
| PUT /v1/hotels/ID | Cập nhật thông tin khách sạn. API này chỉ dành cho nhân viên khách sạn. |
| DELETE /v1/hotels/ID | Xóa khách sạn. API này chỉ dành cho nhân viên khách sạn. |

Bảng 1 Các API liên quan đến khách sạn

### Các API liên quan đến phòng (Room-related APIs)

| API | Chi tiết |
| :--- | :--- |
| GET /v1/hotels/ID/rooms/ID | Lấy thông tin chi tiết của phòng. |
| POST /v1/hotels/ID/rooms | Thêm phòng. API này chỉ dành cho nhân viên khách sạn. |
| PUT /v1/hotels/ID/rooms/ID | Cập nhật thông tin phòng. API này chỉ dành cho nhân viên khách sạn. |
| DELETE /v1/hotels/ID/rooms/ID | Xóa phòng. API này chỉ dành cho nhân viên khách sạn. |

Bảng 2 Các API liên quan đến phòng

### Các API liên quan đến đặt phòng (Reservation related APIs)

| API | Chi tiết |
| :--- | :--- |
| GET /v1/reservations | Lấy lịch sử đặt phòng của người dùng đã đăng nhập. |
| GET /v1/reservations/ID | Lấy thông tin chi tiết của một lượt đặt phòng. |
| POST /v1/reservations | Tạo lượt đặt phòng mới. |
| DELETE /v1/reservations/ID | Hủy đặt phòng. |

Bảng 3 Các API liên quan đến đặt phòng

Tạo lượt đặt phòng mới là một chức năng rất quan trọng. Các tham số request của việc tạo lượt đặt phòng mới (POST /v1/reservations) có thể như sau:
```json
{
  "startDate": "2021-04-28",
  "endDate": "2021-04-30",
  "hotelID": "245",
  "roomID": "U12354673389",
  "reservationID": "U12354673390"
}
```
Lưu ý rằng `reservationID` được dùng làm **idempotency key**, nhằm ngăn việc đặt phòng trùng (double booking). Đặt phòng trùng nghĩa là cùng một phòng được đặt nhiều lần trong cùng một ngày. Chi tiết sẽ được giải thích trong phần “Vấn đề concurrency” của chương “Đi sâu tìm hiểu”.

## Mô hình dữ liệu (Data model)
Trước khi quyết định dùng database nào, hãy xem xét cẩn thận các pattern truy cập dữ liệu. Với hệ thống đặt phòng khách sạn, chúng ta cần hỗ trợ các query sau:

Query 1: Xem thông tin chi tiết của khách sạn.
Query 2: Tìm các loại phòng còn trống trong một khoảng ngày nhất định.
Query 3: Ghi nhận thông tin đặt phòng.
Query 4: Tìm một lượt đặt phòng hoặc lịch sử đặt phòng.

Từ phần ước tính, chúng ta biết quy mô của hệ thống không lớn, nhưng cần chuẩn bị cho lượng traffic tăng đột biến trong những sự kiện lớn. Xét các yêu cầu này, chúng ta chọn relational database vì các lý do sau:
*   Relational database rất phù hợp với workload thiên về đọc (read-heavy) và có tần suất ghi thấp (write less frequently). Nguyên nhân là số người truy cập website/App khách sạn lớn hơn số người thực sự đặt phòng vài bậc độ lớn. NoSQL database thường được tối ưu cho việc ghi, còn relational database hoạt động đủ tốt với workload thiên về đọc.
*   Relational database cung cấp các đảm bảo ACID. Các thuộc tính ACID rất quan trọng đối với hệ thống đặt phòng. Nếu không có các thuộc tính này, sẽ khó ngăn những vấn đề như số dư âm, tính phí trùng và đặt phòng trùng. Các thuộc tính ACID giúp code của application đơn giản hơn nhiều và giúp toàn bộ hệ thống dễ hiểu, dễ suy luận hơn. Relational database thường cung cấp những đảm bảo này.
*   Relational database cho phép lập mô hình dữ liệu dễ dàng. Cấu trúc của dữ liệu nghiệp vụ rất rõ ràng, và mối quan hệ giữa các entity khác nhau (khách sạn, phòng, loại phòng, v.v.) cũng ổn định. Relational database có thể dễ dàng mô hình hóa data model này.

Giờ chúng ta đã chọn relational database làm data store, hãy cùng tìm hiểu thiết kế schema của các bảng. Hình 2 thể hiện một thiết kế schema đơn giản, cũng là cách tự nhiên nhất mà nhiều ứng viên dùng để mô hình hóa hệ thống đặt phòng khách sạn.

![Schema database của Hình 7.2](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.2.png)

Hình 2 Schema database

Hầu hết các thuộc tính đều tự giải thích được, chúng ta chỉ giải thích field `status` trong bảng `reservation`. Field `status` có thể ở một trong các trạng thái sau: đang chờ (pending), đã thanh toán (paid), đã hoàn tiền (refunded), đã hủy (canceled), bị từ chối (rejected). State machine được thể hiện trong Hình 3.

![Trạng thái đặt phòng của Hình 7.3](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.3.png)

Hình 3 Trạng thái đặt phòng

Thiết kế schema này có một vấn đề lớn. Data model này phù hợp với các công ty như Airbnb, vì khi đặt phòng người dùng chỉ định `room_id` (có thể được gọi là `listing_id`). Tuy nhiên, khách sạn thì khác. Trên thực tế, người dùng đặt **một loại phòng (a type of room)** tại một khách sạn cụ thể, chứ không đặt một phòng cụ thể. Ví dụ về loại phòng có thể là phòng tiêu chuẩn, phòng giường lớn, phòng hai giường đôi, v.v. Số phòng được gán khi khách làm thủ tục nhận phòng (check-in), chứ không phải khi đặt phòng. Chúng ta cần cập nhật data model để phản ánh yêu cầu mới này. Hãy xem phần “Data model được cải tiến” trong chương “Đi sâu tìm hiểu” để biết chi tiết.

## Thiết kế cấp cao (High-level design)

Chúng ta áp dụng microservices architecture cho hệ thống đặt phòng khách sạn này. Trong vài năm qua, microservices architecture đã trở nên rất phổ biến. Các công ty sử dụng microservices gồm Amazon, Netflix, Uber, Airbnb, Twitter, v.v. Nếu muốn tìm hiểu thêm về những lợi ích của microservices architecture, bạn có thể xem một số tài liệu hay [1] [2].

Thiết kế của chúng ta được mô hình hóa bằng microservices architecture, như thể hiện trong sơ đồ thiết kế cấp cao ở Hình 4.

![Thiết kế cấp cao của Hình 7.4](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.4.png)

Hình 4 Thiết kế cấp cao

Chúng ta sẽ giới thiệu ngắn gọn từng thành phần của hệ thống theo thứ tự từ trên xuống dưới.

*   **Người dùng (User)**: Người dùng đặt phòng khách sạn qua điện thoại hoặc máy tính.
*   **Admin (nhân viên khách sạn) (Admin)**: Nhân viên khách sạn được cấp quyền thực hiện các thao tác quản trị như hoàn tiền cho khách hàng, hủy đặt phòng, cập nhật thông tin phòng, v.v.
*   **CDN (Content Delivery Network)**: Để có thời gian tải tốt hơn, CDN được dùng để cache mọi static resource, bao gồm JavaScript package, hình ảnh, video, HTML, v.v.
*   **Public API Gateway (Public API Gateway)**: Đây là một managed service hoàn toàn, hỗ trợ rate limiting, authentication và các chức năng khác. API Gateway được cấu hình để route request đến service cụ thể dựa trên endpoint. Ví dụ, request tải trang chủ khách sạn được chuyển đến Hotel Service, còn request đặt phòng khách sạn được route đến Reservation Service.
*   **Internal API (Internal APIs)**: Các API này chỉ dành cho nhân viên khách sạn được cấp quyền. Chúng được truy cập thông qua phần mềm hoặc website nội bộ. Thông thường, chúng còn được bảo vệ thêm bằng VPN (Virtual Private Network).
*   **Hotel Service (Hotel Service)**: Cung cấp thông tin chi tiết về khách sạn và phòng. Dữ liệu khách sạn và phòng thường là static nên có thể dễ dàng cache.
*   **Rate Service (Rate Service)**: Cung cấp giá phòng cho các ngày khác nhau trong tương lai. Một thực tế thú vị trong ngành khách sạn là giá phòng phụ thuộc vào công suất dự kiến của khách sạn vào một ngày cụ thể.
*   **Reservation Service (Reservation Service)**: Nhận request đặt phòng và đặt phòng khách sạn. Service này cũng quản lý inventory phòng khi phòng được đặt hoặc lượt đặt phòng bị hủy.
*   **Payment Service (Payment Service)**: Thực hiện thao tác thanh toán của khách hàng và cập nhật trạng thái đặt phòng thành “đã thanh toán (paid)” khi giao dịch thanh toán thành công, hoặc thành “bị từ chối (rejected)” nếu giao dịch thất bại.
*   **Hotel Management Service (Hotel Management Service)**: Chỉ dành cho nhân viên khách sạn được cấp quyền. Nhân viên khách sạn có thể dùng các chức năng sau: xem các lượt đặt phòng sắp tới, đặt phòng cho khách hàng, hủy đặt phòng, v.v.

Để sơ đồ dễ hiểu hơn, Hình 4 lược bỏ nhiều mũi tên tương tác giữa các microservice. Ví dụ, như Hình 5 thể hiện, cần có một mũi tên giữa Reservation Service và Rate Service. Reservation Service query Rate Service để lấy giá phòng, dùng giá đó để tính tổng tiền phòng của lượt đặt phòng. Một ví dụ khác là Hotel Management Service cần có nhiều mũi tên kết nối với hầu hết các service khác. Khi admin thực hiện thay đổi thông qua Hotel Management Service, request được chuyển tiếp đến service thực sự sở hữu dữ liệu để xử lý các thay đổi đó.

![Các kết nối giữa các service của Hình 7.5](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.5.png)

Hình 5 Các kết nối giữa các service

Trong production system, giao tiếp giữa các service thường sử dụng các RPC framework hiện đại, hiệu năng cao như gRPC. Việc sử dụng các framework như vậy mang lại nhiều lợi ích. Để tìm hiểu chi tiết về gRPC, hãy xem [3].

## Bước 3 - Đi sâu tìm hiểu
Giờ chúng ta đã thảo luận về thiết kế cấp cao, hãy đi sâu vào các nội dung sau.

*   Data model được cải tiến
*   Vấn đề concurrency
*   Mở rộng hệ thống
*   Giải quyết tính không nhất quán dữ liệu trong microservices architecture

### Data model được cải tiến
Như đã nói trong phần thiết kế cấp cao, khi đặt phòng khách sạn, trên thực tế chúng ta đặt một loại phòng chứ không phải một phòng cụ thể. Cần thay đổi những gì trong API và schema của các bảng để đáp ứng điều này?

Với reservation API, `roomID` trong các tham số request được thay bằng `roomTypeID`. API tạo lượt đặt phòng như sau:

POST /v1/reservations
Tham số request:
```json
{
"startDate": "2021-04-28",
"endDate":"2021-04-30",
"hotelID":"245",
"roomTypeID":"12354673389",
"roomCount":"3",
"reservationID":"U12354673390"
}
```
Schema được cập nhật được thể hiện trong Hình 6.

![Schema được cập nhật của Hình 7.6](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.6.png)

Hình 6 Schema được cập nhật

Chúng ta sẽ giới thiệu ngắn gọn một số bảng quan trọng nhất.

*   **room**: Chứa thông tin về phòng.
*   **room_type_rate**: Lưu dữ liệu giá của một loại phòng cụ thể cho các ngày trong tương lai.
*   **reservation**: Ghi nhận dữ liệu đặt phòng của khách.
*   **room_type_inventory**: Lưu dữ liệu inventory phòng khách sạn. Bảng này rất quan trọng đối với hệ thống đặt phòng, vì vậy hãy xem kỹ từng cột.
  *   **hotel_id**: ID của khách sạn.
  *   **room_type_id**: ID của loại phòng.
  *   **date**: Một ngày cụ thể.
  *   **total_inventory**: Tổng số phòng trừ đi những phòng tạm thời bị loại khỏi inventory. Một số phòng có thể bị gỡ khỏi inventory để bảo trì.
  *   **total_reserved**: Tổng số phòng đã được đặt cho `hotel_id`, `room_type_id` và ngày đã chỉ định.

Có những cách khác để thiết kế bảng `room_type_inventory`, nhưng mỗi ngày một dòng sẽ giúp quản lý và query các lượt đặt phòng trong một khoảng ngày dễ dàng hơn. Như Hình 6 thể hiện, (hotel_id, room_type_id, date) là composite primary key. Các row trong bảng được pre-fill bằng dữ liệu inventory của tất cả các ngày trong 2 năm tới. Chúng ta có một scheduled job chạy hàng ngày để pre-fill dữ liệu inventory khi ngày hiện tại tiến xa hơn.

Giờ chúng ta đã hoàn tất thiết kế schema, hãy ước tính dung lượng lưu trữ. Như đã đề cập trong phần ước tính, chúng ta có 5.000 khách sạn. Giả sử mỗi khách sạn có 20 loại phòng. Như vậy sẽ là (5.000 khách sạn x 20 loại phòng x 2 năm x 365 ngày) = 73 triệu row. 73 triệu row dữ liệu không lớn, một database duy nhất là đủ để lưu trữ dữ liệu này. Tuy nhiên, một server đơn lẻ đồng nghĩa với single point of failure. Để đạt high availability, chúng ta có thể thiết lập database replication trên nhiều region hoặc availability zone.

Bảng 4 hiển thị dữ liệu mẫu của bảng “room_type_inventory”.

| hotel_id | room_type_id | date | total_inventory | total_reserved |
| :--- | :--- | :--- | :--- | :--- |
| 211 | 1001 | 2021-06-01 | 100 | 80 |
| 211 | 1001 | 2021-06-02 | 100 | 82 |
| 211 | 1001 | 2021-06-03 | 100 | 86 |
| 211 | 1001 | ... | ... | |
| 211 | 1001 | 2023-05-31 | 100 | 0 |
| 211 | 1002 | 2021-06-01 | 200 | 164 |
| 2210 | 101 | 2021-06-01 | 30 | 23 |
| 2210 | 101 | 2021-06-02 | 30 | 25 |

Bảng 4 Dữ liệu mẫu của bảng “room_type_inventory”

Bảng `room_type_inventory` được dùng để kiểm tra xem khách hàng có thể đặt một loại phòng cụ thể hay không. Input và output của việc đặt phòng có thể như sau:
*   Input: startDate (2021-07-01), endDate (2021-07-03), roomTypeID, hotelId, numberOfRoomsToReserve
*   Output: True nếu loại phòng được chỉ định còn inventory và người dùng có thể đặt. Nếu không, trả về false.

Xét từ góc độ SQL, việc này gồm hai bước:

1.  Chọn các row trong khoảng ngày
```sql
SELECT date, total_inventory, total_reserved
FROM room_type_inventory
WHERE room_type_id = ${roomTypeID} AND hotel_id = ${hotelId}
AND date between ${startDate} and ${endDate}
```
Code listing 1 Chọn các row

Query này trả về dữ liệu như sau:

| date | total_inventory | total_reserved |
| :--- | :--- | :--- |
| 2021-07-01 | 100 | 97 |
| 2021-07-02 | 100 | 96 |
| 2021-07-03 | 100 | 95 |

Bảng 5: Inventory khách sạn

2. Với mỗi record, application kiểm tra điều kiện sau:
```java
if (total_reserved + ${numberOfRoomsToReserve}) <= total_inventory
```
Nếu điều kiện trả về true cho tất cả record, điều đó có nghĩa là có đủ phòng cho từng ngày trong khoảng ngày.

Một yêu cầu là hỗ trợ overbooking 10%. Với schema mới, việc này rất dễ thực hiện:
```java
if (total_reserved + ${numberOfRoomsToReserve}) <= 110% * total_inventory
```
Lúc này, interviewer có thể hỏi một câu hỏi tiếp theo: “Bạn sẽ làm gì nếu lượng dữ liệu đặt phòng quá lớn đối với một database duy nhất?” Có một số chiến lược:

*   Chỉ lưu dữ liệu đặt phòng hiện tại và tương lai. Lịch sử đặt phòng không thường xuyên được truy cập. Vì vậy, chúng có thể được archive, thậm chí một phần có thể chuyển sang cold storage.
*   Database sharding. Các query thường xuyên nhất gồm tạo lượt đặt phòng hoặc tìm lượt đặt phòng theo tên. Trong cả hai query, trước tiên chúng ta đều cần chọn khách sạn, nghĩa là `hotel_id` là một sharding key tốt. Dữ liệu có thể được shard bằng `hash(hotel_id) % number_of_servers`.

### Vấn đề concurrency
Một vấn đề quan trọng khác cần nghiên cứu là đặt phòng trùng. Chúng ta cần giải quyết hai vấn đề: 1) Một người dùng nhấn nút “đặt phòng” nhiều lần. 2) Nhiều người dùng cố gắng đặt cùng một phòng tại cùng một thời điểm.

Hãy xem trường hợp đầu tiên. Như Hình 7 thể hiện, hai lượt đặt phòng đã được tạo.

![Hai lượt đặt phòng được tạo trong Hình 7.7](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.7.png)

Hình 7 Hai lượt đặt phòng được tạo

Có hai cách phổ biến để giải quyết vấn đề này:

*   **Triển khai ở client**. Ngay khi request được gửi đi, client có thể làm mờ, ẩn hoặc vô hiệu hóa nút “submit”. Trong hầu hết trường hợp, cách này sẽ ngăn được vấn đề double-click. Tuy nhiên, cách này không hoàn toàn đáng tin cậy. Ví dụ, người dùng có thể tắt JavaScript để vượt qua kiểm tra ở client, hoặc vô tình nhấn nút hai lần do vấn đề mạng.
*   **Giải pháp API**: Thêm một **idempotency key** vào request của reservation API. Một API call được gọi là **idempotent** nếu dù được gọi bao nhiêu lần thì cũng cho cùng một kết quả. Hình 8 minh họa cách dùng idempotency key (`reservation_id`) để tránh vấn đề đặt phòng trùng. Các bước chi tiết được giải thích bên dưới.

![Figure7.8.png](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.8.png)


1. **Tạo order đặt phòng**. Sau khi khách hàng nhập thông tin chi tiết của lượt đặt phòng (loại phòng, ngày check-in, ngày check-out, v.v.) và nhấn nút “tiếp tục”, Reservation Service sẽ tạo một order đặt phòng.
2. Hệ thống tạo order đặt phòng để khách hàng kiểm tra. `reservation_id` duy nhất được tạo bởi global unique ID generator và trả về trong API response. UI của bước này có thể như sau:

![Figure7.9.png](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.9.png)

Hình 9 Trang xác nhận (nguồn: [4])

3a. **Submit reservation 1**. `reservation_id` được gửi kèm trong request. Nó là primary key của bảng reservation (Hình 6). Lưu ý rằng idempotency key không nhất thiết phải là `reservation_id`. Chúng ta chọn `reservation_id` vì nó đã tồn tại và rất phù hợp với thiết kế của mình.

3b. Nếu người dùng nhấn nút “hoàn tất đặt phòng” lần thứ hai, **reservation 2** sẽ được gửi đi. Vì `reservation_id` là primary key của bảng reservation, chúng ta có thể tận dụng **unique constraint** của key này để đảm bảo không xảy ra đặt phòng trùng.

Hình 10 giải thích tại sao có thể tránh được đặt phòng trùng.

![Xung đột unique constraint của Hình 7.10](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.10.png)

Hình 10 Xung đột unique constraint

**Tình huống 2: Điều gì xảy ra khi nhiều người dùng cùng lúc đặt cùng một loại phòng trong khi chỉ còn một phòng?** Hãy xem xét tình huống trong Hình 11.

![Race condition của Hình 7.11](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.11.png)

Hình 11 Race condition

Hãy giả sử isolation level của database không phải là serializable [5]. User 1 và User 2 cố gắng cùng lúc đặt cùng một loại phòng, nhưng chỉ còn một phòng. Chúng ta gọi thao tác của User 1 là “transaction 1”, thao tác của User 2 là “transaction 2”. Khi đó, khách sạn có tổng cộng 100 phòng, trong đó 99 phòng đã được đặt.
Transaction 2 kiểm tra xem còn đủ phòng hay không bằng cách kiểm tra `(total_reserved + rooms_to_book) <= total_inventory`. Vì còn 1 phòng, kết quả trả về là true.
Transaction 1 cũng kiểm tra xem còn đủ phòng hay không bằng cách kiểm tra `(total_reserved + rooms_to_book) <= total_inventory`. Vì còn 1 phòng, kết quả của nó cũng là true.
Transaction 1 đặt phòng và cập nhật inventory: `reserved_room` trở thành 100.
Sau đó transaction 2 cũng đặt phòng. Thuộc tính **isolation** trong ACID có nghĩa là transaction database phải hoàn thành công việc độc lập với các transaction khác. Vì vậy, trước khi transaction 1 hoàn tất (commit), các thay đổi dữ liệu do transaction 1 thực hiện không hiển thị với transaction 2. Do đó, transaction 2 vẫn thấy `total_reserved` là 99 và đặt phòng bằng cách cập nhật inventory: `reserved_room` trở thành 100. Kết quả là hệ thống cho phép cả hai người dùng đặt phòng, dù chỉ còn một phòng.
Transaction 1 commit thay đổi thành công.
Transaction 2 commit thay đổi thành công.

Để giải quyết vấn đề này, thông thường cần một dạng lock nào đó. Chúng ta sẽ tìm hiểu các kỹ thuật sau:

*   Pessimistic locking
*   Optimistic locking
*   Database constraints

Trước khi bắt đầu sửa lỗi, hãy xem pseudo-code SQL dùng để đặt phòng. SQL này gồm hai phần:

*   Kiểm tra inventory phòng
*   Đặt phòng

```sql
# Bước 1: Kiểm tra tồn kho phòng
SELECT date, total_inventory, total_reserved
FROM room_type_inventory
WHERE room_type_id = ${roomTypeID} AND hotel_id = ${hotelId}
AND date between ${startDate} and ${endDate}

# Với mỗi bản ghi được trả về ở bước 1
if ((total_reserved + ${numberOfRoomsToReserve}) > 110% * total_inventory) {
    Rollback
}

# Bước 2: Đặt phòng
UPDATE room_type_inventory
SET total_reserved = total_reserved + ${numberOfRoomsToReserve}
WHERE room_type_id = ${roomTypeID}
AND date between ${startDate} and ${endDate}

Commit
```
Code listing 2 Đặt phòng

### Giải pháp 1: Pessimistic locking (Pessimistic locking)
Pessimistic locking [6], còn được gọi là pessimistic concurrency control, ngăn việc cập nhật đồng thời bằng cách lock record ngay khi người dùng bắt đầu cập nhật nó. Những người dùng khác cố gắng cập nhật record đó phải chờ đến khi người dùng đầu tiên giải phóng lock (commit thay đổi).

Với MySQL, câu lệnh “SELECT ... FOR UPDATE” hoạt động bằng cách lock các row được query chọn ra. Hãy giả sử một transaction được khởi động bởi “transaction 1”. Các transaction khác phải chờ transaction 1 hoàn tất rồi mới có thể bắt đầu transaction khác. Chi tiết được thể hiện trong Hình 12.

![Pessimistic locking của Hình 7.12](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.12.png)

Hình 12 Pessimistic locking

Trong Hình 12, câu lệnh “SELECT ... FOR UPDATE” của transaction 2 sẽ chờ transaction 1 hoàn tất, vì transaction 1 đã lock các row này. Sau khi transaction 1 hoàn tất, `total_reserved` trở thành 100, nghĩa là User 2 không còn phòng để đặt.

**Ưu điểm:**

*   Ngăn application cập nhật dữ liệu đang được thay đổi hoặc đã bị thay đổi.
*   Dễ triển khai và tránh conflict bằng cách tuần tự hóa các lần cập nhật. Pessimistic locking rất hữu ích khi data contention cao.

**Nhược điểm:**

*   Deadlock có thể xảy ra khi lock nhiều resource. Viết code application không deadlock có thể là một thách thức.
*   Giải pháp này không scale tốt. Nếu một transaction bị lock quá lâu, các transaction khác sẽ không thể truy cập resource đó. Điều này ảnh hưởng đáng kể đến performance của database, đặc biệt khi transaction mất nhiều thời gian hoặc liên quan đến nhiều entity.

Do những hạn chế này, chúng ta không khuyến nghị dùng pessimistic locking trong hệ thống đặt phòng.

### Giải pháp 2: Optimistic locking (Optimistic locking)
Optimistic locking [7], còn được gọi là optimistic concurrency control, cho phép nhiều user concurrent cùng cố gắng cập nhật một resource.

Có hai cách phổ biến để triển khai optimistic locking: version number và timestamp. Version number thường được xem là lựa chọn tốt hơn, vì clock của server có thể bị lệch theo thời gian. Chúng ta sẽ dùng version number để giải thích cách optimistic locking hoạt động.

Hình 13 thể hiện một trường hợp thành công và một trường hợp thất bại.

![Optimistic locking của Hình 7.13](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.13.png)

Hình 13 Optimistic locking

Một column mới có tên “version” được thêm vào database table.
Trước khi user sửa một row trong database, user đọc version number của row đó.
Khi user update row, user tăng version number lên 1 rồi ghi version number đó.
Database thực hiện một lần kiểm tra validation; version number tiếp theo phải lớn hơn version number hiện tại đúng 1. Nếu validation thất bại, transaction bị abort và user retry từ bước 2.

Optimistic locking thường nhanh hơn pessimistic locking vì không cần lock database. Tuy nhiên, khi concurrency cao, performance của optimistic locking giảm đáng kể.

Để hiểu nguyên nhân, hãy xét trường hợp nhiều client cùng lúc cố gắng đặt phòng trong một khách sạn cụ thể. Vì không giới hạn số client có thể đọc số phòng còn trống, tất cả client đều đọc được cùng số phòng còn trống và cùng current version number. Khi các client khác nhau đặt phòng và ghi kết quả trở lại database, chỉ một client thành công, các client còn lại nhận được thông báo version check thất bại. Những client này phải retry. Ở các vòng retry tiếp theo, vẫn chỉ một client thành công và các client còn lại tiếp tục phải retry. Dù kết quả cuối cùng là chính xác, việc retry liên tục sẽ tạo ra trải nghiệm người dùng rất tệ.

**Ưu điểm:**

*   Ngăn application chỉnh sửa stale data.
*   Chúng ta không cần lock database resource. Từ góc nhìn của database, thực tế không có lock nào. Tất cả phụ thuộc vào cách application xử lý logic version number.
*   Optimistic locking thường được dùng khi data contention thấp. Khi conflict hiếm khi xảy ra, transaction có thể hoàn thành mà không phải trả chi phí quản lý lock.

**Nhược điểm:**

*   Performance kém khi data contention cao.

Vì QPS của hệ thống đặt phòng thường không cao, optimistic locking là một lựa chọn tốt cho hệ thống đặt phòng khách sạn.

### Giải pháp 3: Database constraints (Database constraints)
Phương pháp này rất giống optimistic locking. Hãy tìm hiểu cách nó hoạt động. Trong bảng `room_type_inventory`, thêm constraint sau:

`CONSTRAINT check_room_count CHECK((total_inventory - total_reserved) >= 0)`

Dùng cùng ví dụ như Hình 14, khi User 2 cố gắng đặt phòng, `total_reserved` trở thành 101, vi phạm constraint `total_inventory (100) - total_reserved (101) >= 0`. Sau đó transaction bị rollback.

![Database constraint của Hình 7.14](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.14.png)

Hình 14 Database constraint

**Ưu điểm:**

*   Dễ triển khai.
*   Hoạt động tốt khi data contention cực thấp.

**Nhược điểm:**

*   Tương tự optimistic locking, khi data contention cao, nó có thể dẫn đến nhiều lần thất bại. Người dùng có thể thấy vẫn còn phòng trống, nhưng khi cố gắng đặt phòng lại nhận response “không còn phòng”. Trải nghiệm này khiến người dùng thất vọng.
*   Database constraint không dễ version control như code application.
*   Không phải database nào cũng hỗ trợ constraint. Khi migrate từ database schema này sang database schema khác, điều đó có thể gây ra vấn đề.

Vì phương pháp này dễ triển khai và data contention trong hệ thống đặt phòng khách sạn thường không cao (QPS thấp), đây là một lựa chọn tốt khác cho hệ thống đặt phòng khách sạn.

## Khả năng mở rộng (Scalability)
Thông thường, tải của hệ thống đặt phòng khách sạn không cao. Tuy nhiên, interviewer có thể hỏi tiếp: “Nếu hệ thống đặt phòng khách sạn không chỉ được dùng cho một chuỗi khách sạn mà còn được dùng cho một website du lịch phổ biến như booking.com hoặc expedia.com thì sao?” Trong trường hợp đó, QPS có thể cao hơn 1.000 lần.

Khi tải hệ thống cao, chúng ta cần hiểu điều gì có thể trở thành bottleneck. Tất cả service của chúng ta đều stateless, nên có thể dễ dàng scale bằng cách thêm server. Tuy nhiên, database là stateful và không thể scale chỉ bằng cách thêm database. Hãy cùng tìm hiểu cách scale database.

### Database sharding (Database sharding)
Một cách để scale database là áp dụng database sharding. Ý tưởng cốt lõi là chia dữ liệu vào nhiều database để mỗi database chỉ chứa một phần dữ liệu.

Khi shard database, chúng ta cần cân nhắc cách phân phối dữ liệu. Như đã thấy trong phần data model, hầu hết query đều cần filter theo `hotel_id`. Vì vậy, kết luận tự nhiên là shard dữ liệu theo `hotel_id`. Trong Hình 15, tải được phân tán vào 16 shard. Giả sử QPS là 30.000. Sau khi shard database, mỗi shard xử lý 30.000 / 16 = 1875 QPS, nằm trong khả năng chịu tải của một MySQL server.

![Vị trí dành cho Hình 7.15: Database sharding](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.15.png)

Hình 15 Database sharding

### Caching (Caching)
Dữ liệu inventory khách sạn có một đặc điểm thú vị: chỉ inventory khách sạn hiện tại và trong tương lai mới có ý nghĩa, vì khách hàng chỉ có thể đặt phòng trong tương lai gần.

Do đó, với lựa chọn storage, lý tưởng nhất là chúng ta muốn có cơ chế **time-to-live (TTL)** để tự động xóa dữ liệu hết hạn. Có thể query dữ liệu lịch sử trong database khác. Redis là một lựa chọn tốt vì TTL và chiến lược loại bỏ cache **Least Recently Used (LRU)** có thể giúp tối ưu việc sử dụng memory.

Nếu tốc độ load và khả năng scale của database trở thành vấn đề (ví dụ, chúng ta đang thiết kế hệ thống quy mô booking.com hoặc expedia.com), chúng ta có thể thêm một cache layer phía trên database và chuyển logic “kiểm tra inventory phòng” và “đặt phòng” vào cache layer, như thể hiện trong Hình 16. Trong thiết kế này, chỉ một phần nhỏ request đến inventory database vì hầu hết request bị inventory cache chặn lại. Một điểm đáng lưu ý là ngay cả khi Redis hiển thị còn đủ inventory, chúng ta vẫn cần kiểm tra lại inventory ở phía database để đảm bảo an toàn. Database là **source of truth** của dữ liệu inventory.


![Hình 16 Cache](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.16.png)

Trước tiên, hãy giới thiệu từng component trong hệ thống này.

**Reservation service (Reservation service)**: Hỗ trợ các API quản lý inventory sau:
- Query số phòng còn trống của một loại phòng và khoảng ngày nhất định.
- Đặt phòng bằng cách thực hiện `total_reserved + 1`.
- Cập nhật inventory khi người dùng hủy đặt phòng.

**Inventory cache (Inventory cache)**: Tất cả thao tác query quản lý inventory được chuyển vào inventory cache (Redis), vì vậy chúng ta cần pre-fill dữ liệu inventory vào cache. Cache là một key-value store có cấu trúc sau:
- `key`: `hotelID_roomTypeID_{date}`
- `value`: Số phòng còn trống của hotel ID, room type ID và ngày đã cho.

Đối với hệ thống đặt phòng khách sạn, lượng thao tác đọc (kiểm tra inventory phòng) cao hơn thao tác ghi một bậc độ lớn. Hầu hết thao tác đọc được cache trả lời.

**Inventory DB (Inventory DB)**: Lưu dữ liệu inventory và đóng vai trò source of truth.

#### Những thách thức mới do cache mang lại (New challenges posed by the cache)
Thêm cache layer cải thiện đáng kể khả năng scale và throughput của hệ thống, nhưng cũng tạo ra thách thức mới: làm thế nào duy trì tính nhất quán dữ liệu giữa database và cache.

Khi người dùng đặt phòng, trong happy path sẽ thực hiện hai thao tác:
1. Query inventory phòng để biết còn đủ phòng hay không. Query này chạy trên **inventory cache**.
2. Cập nhật dữ liệu inventory. Trước tiên cập nhật **inventory database**. Sau đó propagate thay đổi bất đồng bộ đến cache. Việc cập nhật cache bất đồng bộ này có thể được gọi từ code application để cập nhật inventory cache sau khi dữ liệu được lưu vào database. Nó cũng có thể dùng **Change Data Capture (CDC)** [8] để propagate. CDC là một cơ chế đọc các thay đổi dữ liệu từ database rồi áp dụng thay đổi đó vào một data system khác. Một giải pháp phổ biến là Debezium [9]. Nó dùng source connector để đọc thay đổi từ database rồi áp dụng chúng vào các giải pháp cache như Redis [10].

Vì dữ liệu inventory được cập nhật trước trên database, cache có thể không phản ánh dữ liệu inventory mới nhất. Ví dụ, database có thể cho biết không còn phòng, trong khi cache lại báo vẫn còn phòng, hoặc ngược lại.

Nếu suy nghĩ kỹ, bạn sẽ thấy tính nhất quán giữa inventory cache và database thực ra không quan trọng, miễn là database thực hiện bước kiểm tra inventory cuối cùng.

Hãy xem một ví dụ. Giả sử trạng thái cache cho biết vẫn còn phòng, nhưng database cho biết không còn. Trong trường hợp này, khi người dùng query inventory phòng, họ thấy vẫn còn phòng nên cố gắng đặt. Khi request đến inventory database, database thực hiện validation và phát hiện không còn phòng. Khi đó client nhận được lỗi cho biết đã có người khác đặt phòng cuối cùng trước họ. Khi người dùng refresh website, họ có thể thấy không còn phòng vì database đã đồng bộ dữ liệu inventory vào cache trước khi họ nhấn nút refresh.

**Ưu điểm:**
- Giảm tải database. Vì cache layer trả lời các request query, tải của database giảm đáng kể.
- Performance cao. Query đọc rất nhanh vì kết quả được lấy từ memory.

**Nhược điểm:**
- Duy trì tính nhất quán dữ liệu giữa database và cache rất khó. Chúng ta cần suy nghĩ cẩn thận về ảnh hưởng của sự không nhất quán này đến trải nghiệm người dùng.

### Tính nhất quán dữ liệu giữa các service (Data consistency among services)
Trong **monolithic architecture** truyền thống [11], một relational database dùng chung được sử dụng để đảm bảo tính nhất quán dữ liệu. Trong thiết kế microservices của chúng ta, chúng ta chọn phương pháp hybrid, để Reservation Service đồng thời xử lý reservation API và inventory API, nhờ đó các bảng inventory và reservation được lưu trong cùng một relational database. Như đã nói trong phần “Vấn đề concurrency”, cách sắp xếp này cho phép tận dụng các thuộc tính ACID của relational database để xử lý một cách hiệu quả nhiều vấn đề concurrency phát sinh trong quy trình đặt phòng.

Tuy nhiên, nếu interviewer là một người theo chủ nghĩa thuần túy về microservices, họ có thể chất vấn phương pháp hybrid này. Theo quan điểm của họ, trong microservices architecture, mỗi microservice có database riêng như phần bên phải Hình 17.

![Vị trí dành cho Hình 7.17: Monolithic vs microservice](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.17.png)

Hình 17 Monolithic vs microservice

Thiết kế thuần túy này tạo ra nhiều vấn đề về tính nhất quán dữ liệu. Vì đây là lần đầu chúng ta đề cập đến microservices, hãy giải thích cách vấn đề xảy ra và nguyên nhân. Để dễ hiểu hơn, phần thảo luận này chỉ sử dụng hai service. Trong thế giới thực, một công ty có thể có hàng trăm microservice. Trong monolithic architecture, như Hình 18 thể hiện, các thao tác khác nhau có thể được đóng gói trong một transaction để đảm bảo các thuộc tính ACID.

![Monolithic architecture của Hình 7.18](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.18.png)

Hình 18 Monolithic architecture

Tuy nhiên, trong microservices architecture, mỗi service có database riêng. Một thao tác atomic về mặt logic có thể trải dài qua nhiều service. Điều này có nghĩa là chúng ta không thể dùng một transaction duy nhất để đảm bảo tính nhất quán dữ liệu. Như Hình 19 thể hiện, nếu thao tác update thất bại trong reservation database, chúng ta cần rollback số lượng phòng đã reserve trong inventory database. Thông thường chỉ có một happy path, nhưng có nhiều tình huống thất bại có thể dẫn đến dữ liệu không nhất quán.

![Microservice architecture của Hình 7.19](..%2Fimages%2Fv2%2Fchapter07%2FFigure7.19.png)

Hình 19 Microservice architecture

Để giải quyết vấn đề dữ liệu không nhất quán, dưới đây là phần tổng quan cấp cao về các kỹ thuật được công nhận trong ngành. Nếu muốn đọc chi tiết, hãy tham khảo các tài liệu.

*   **Two-phase commit (2PC)** [12]. 2PC là một database protocol dùng để đảm bảo commit transaction atomic trên nhiều node, nghĩa là tất cả node hoặc cùng thành công, hoặc cùng thất bại. Vì 2PC là một blocking protocol, failure của một node có thể block toàn bộ process cho đến khi node đó khôi phục. Performance của nó không lý tưởng.
*   **Saga**. Saga là một chuỗi các local transaction. Mỗi transaction cập nhật và publish một message để trigger bước transaction tiếp theo. Nếu một bước thất bại, Saga thực hiện các compensating transaction để hoàn tác các thay đổi do các transaction trước đó thực hiện [13]. 2PC thực hiện ACID transaction trong một commit duy nhất, còn Saga gồm nhiều bước và phụ thuộc vào **eventual consistency**.

Cần lưu ý rằng việc giải quyết dữ liệu không nhất quán giữa các microservice cần một số cơ chế phức tạp, làm tăng đáng kể độ phức tạp tổng thể của thiết kế. Với tư cách architect, bạn cần quyết định liệu độ phức tạp tăng thêm có đáng hay không. Với vấn đề này, chúng ta cho rằng không đáng, nên chọn cách thực tế hơn là lưu dữ liệu reservation và inventory trong cùng một relational database.

## Bước 4 - Tóm tắt

Trong chương này, chúng ta đã trình bày thiết kế một hệ thống đặt phòng khách sạn. Chúng ta bắt đầu bằng việc thu thập yêu cầu và thực hiện ước tính để hiểu quy mô. Trong thiết kế cấp cao, chúng ta trình bày thiết kế API, bản thiết kế ban đầu của data model và sơ đồ kiến trúc hệ thống. Trong phần đi sâu tìm hiểu, vì nhận ra rằng việc đặt phòng nên được thực hiện ở cấp độ loại phòng (room type-level), thay vì nhắm đến một phòng cụ thể, chúng ta đã tìm hiểu một thiết kế schema database thay thế. Chúng ta đã thảo luận sâu về race condition và đưa ra một số giải pháp tiềm năng:

*   Pessimistic locking (Pessimistic locking)
*   Optimistic locking (Optimistic locking)
*   Database constraints (Database constraints)

Tiếp đó, chúng ta thảo luận các cách khác nhau để scale hệ thống, bao gồm database sharding (database sharding) và dùng Redis cache. Cuối cùng, chúng ta xử lý vấn đề tính nhất quán dữ liệu trong microservices architecture và giới thiệu ngắn gọn một số giải pháp.

Chúc mừng bạn đã học đến đây! Giờ hãy tự thưởng cho mình một chút. Làm tốt lắm!

## Tài liệu tham khảo (Reference Material)

[1] Microservices: https://en.wikipedia.org/wiki/Microservices  
[2] Lợi ích của microservices architecture là gì?: https://www.appdynamics.com/topics/benefits-of-microservices  
[3] gRPC: https://www.grpc.io/docs/what-is-grpc/introduction/  
[4] Nguồn: Booking.com iOS app  
[5] Serializability: https://en.wikipedia.org/wiki/Serializability  
[6] Optimistic và pessimistic record locking: https://ibm.co/3Eb293O  
[7] Optimistic concurrency control: https://en.wikipedia.org/wiki/Optimistic_concurrency_control  
[8] Change Data Capture: https://docs.oracle.com/cd/B10500_01/server.920/a96520/cdc.htm  
[9] Debizium: https://debezium.io/  
[10] Redis sink: https://bit.ly/3r3AEUD  
[11] Monolithic architecture: https://microservices.io/patterns/monolithic.html  
[12] Two-phase commit protocol: https://en.wikipedia.org/wiki/Two-phase_commit_protocol  
[13] Saga: https://microservices.io/patterns/data/saga.html  
