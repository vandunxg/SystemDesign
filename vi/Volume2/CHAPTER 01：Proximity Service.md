# Chương 1: Dịch vụ lân cận

Trong chương này, chúng ta thiết kế một dịch vụ tìm địa điểm lân cận. Dịch vụ địa điểm lân cận được dùng để tìm các địa điểm như nhà hàng, khách sạn, rạp chiếu phim, bảo tàng ở gần người dùng. Đây là một thành phần cốt lõi, hỗ trợ các tính năng như tìm nhà hàng tốt nhất ở gần trên Yelp hoặc tìm trạm xăng gần nhất trên Google Maps. Hình 1.1 minh họa giao diện người dùng dùng để tìm nhà hàng lân cận trên Yelp [1]. Lưu ý rằng các tile bản đồ được dùng trong cuốn sách này đến từ Stamen Design [2], còn dữ liệu đến từ OpenStreetMap [3].  
![Tìm kiếm địa điểm lân cận trên Yelp](../../images/v2/chapter01/Figure1.1.png)  
Hình 1.1: Tìm kiếm địa điểm lân cận trên Yelp

## Bước 1 - Hiểu vấn đề và xác định phạm vi thiết kế
Yelp hỗ trợ rất nhiều tính năng, nhưng trong một buổi phỏng vấn chúng ta không thể thiết kế tất cả, vì vậy việc đặt câu hỏi để thu hẹp phạm vi là rất quan trọng. Cuộc hội thoại giữa interviewer và candidate có thể diễn ra như sau:

Candidate: Người dùng có thể chỉ định bán kính tìm kiếm không? Nếu không có đủ cơ sở kinh doanh trong bán kính tìm kiếm thì hệ thống có mở rộng phạm vi tìm kiếm không?

Interviewer: Đây là một câu hỏi rất hay. Hãy giả định rằng chúng ta chỉ quan tâm đến các cơ sở kinh doanh trong bán kính được chỉ định. Nếu còn thời gian, chúng ta có thể thảo luận cách mở rộng phạm vi tìm kiếm khi không có đủ cơ sở kinh doanh trong bán kính đó.

Candidate: Bán kính tối đa được phép là bao nhiêu? Tôi có thể giả định là 20 km (12.5 dặm) không?

Interviewer: Đây là một giả định hợp lý.

Candidate: Người dùng có thể thay đổi bán kính tìm kiếm trên UI không?

Interviewer: Có, chúng ta có các lựa chọn sau: 0.5 km (0.31 dặm), 1 km (0.62 dặm), 2 km (1.24 dặm), 5 km (3.1 dặm) và 20 km (12.42 dặm).

Candidate: Thông tin cơ sở kinh doanh được thêm, xóa hoặc cập nhật như thế nào? Chúng ta có cần phản ánh các thao tác này theo thời gian thực không?

Interviewer: Chủ cơ sở kinh doanh có thể thêm, xóa hoặc cập nhật cơ sở kinh doanh. Hãy giả định rằng chúng ta có một thỏa thuận nghiệp vụ từ trước, theo đó các cơ sở kinh doanh mới được thêm/cập nhật sẽ có hiệu lực vào ngày hôm sau.

Candidate: Người dùng có thể đang di chuyển khi sử dụng ứng dụng/trang web, nên sau một thời gian kết quả tìm kiếm có thể hơi khác. Chúng ta có cần liên tục refresh trang để giữ kết quả mới nhất không?

Interviewer: Hãy giả định rằng người dùng di chuyển rất chậm, nên chúng ta không cần liên tục refresh trang.

### Yêu cầu chức năng
Dựa trên cuộc hội thoại này, chúng ta tập trung vào 3 chức năng chính:
- Trả về tất cả cơ sở kinh doanh dựa trên vị trí của người dùng (một cặp tọa độ vĩ độ và kinh độ) và bán kính.
- Chủ cơ sở kinh doanh có thể thêm, xóa hoặc cập nhật cơ sở kinh doanh, nhưng thông tin này không cần được phản ánh theo thời gian thực.
- Khách hàng có thể xem thông tin chi tiết của cơ sở kinh doanh.

### Yêu cầu phi chức năng
Từ các yêu cầu nghiệp vụ, chúng ta có thể suy ra một loạt yêu cầu phi chức năng. Bạn cũng nên xác nhận các yêu cầu này với interviewer.

- Độ trễ thấp. Người dùng phải có thể nhanh chóng xem các cơ sở kinh doanh lân cận.
- Quyền riêng tư dữ liệu. Thông tin vị trí là dữ liệu nhạy cảm. Khi thiết kế location-based service (LBS), chúng ta luôn phải cân nhắc quyền riêng tư của người dùng. Chúng ta cần tuân thủ các luật về quyền riêng tư dữ liệu như General Data Protection Regulation (GDPR)[4] và California Consumer Privacy Act (CCPA)[5].
- Yêu cầu availability và khả năng mở rộng cao. Chúng ta phải bảo đảm hệ thống có thể xử lý lưu lượng tăng đột biến trong giờ cao điểm ở các khu vực đông dân cư.

### Ước tính sơ bộ
Hãy xem một số phép tính sơ bộ để xác định quy mô và thách thức tiềm ẩn mà giải pháp của chúng ta cần xử lý. Giả sử chúng ta có 100 triệu người dùng hoạt động hằng ngày và 200 triệu cơ sở kinh doanh.

Tính QPS
Số giây trong một ngày = 24×60×60 = 86,400. Chúng ta có thể làm tròn thành 10^5 để thuận tiện tính toán. 10^5 được dùng trong cuốn sách này để biểu thị số giây trong một ngày.
- Giả sử mỗi người dùng thực hiện 5 truy vấn tìm kiếm mỗi ngày.
- Search QPS = 100 triệu×5/10^5 = 5,000

## Bước 2 - Đề xuất thiết kế cấp cao và nhận được sự đồng thuận
Trong phần này, chúng ta thảo luận các nội dung sau:
- Thiết kế API
- Thiết kế cấp cao
- Thuật toán tìm cơ sở kinh doanh lân cận
- Mô hình dữ liệu

### Thiết kế API
Chúng ta dùng quy ước RESTful API để thiết kế một API đơn giản hóa.

``GET /v1/search/nearby``  
Endpoint này trả về các cơ sở kinh doanh dựa trên điều kiện tìm kiếm cụ thể. Trong ứng dụng thực tế, kết quả tìm kiếm thường được phân trang. Phân trang[6] không phải trọng tâm của chương này, nhưng đáng được đề cập trong buổi phỏng vấn.

Tham số request:

| Trường | Mô tả | Kiểu |
|------|------|------|
| latitude | Vĩ độ của vị trí đã cho | decimal |
| longitude | Kinh độ của vị trí đã cho | decimal |
| radius | Tùy chọn. Mặc định là 5000 mét (khoảng 3 dặm) | int |

Bảng 1.1: Tham số request
```
{
    "total": 18,
    "businesses": [{business object}]
}
```
Đối tượng business chứa tất cả nội dung cần thiết để render trang kết quả tìm kiếm, nhưng chúng ta vẫn có thể cần thêm các thuộc tính như hình ảnh, đánh giá, số sao, v.v. để render trang chi tiết cơ sở kinh doanh. Vì vậy, khi người dùng nhấp vào trang chi tiết cơ sở kinh doanh, thông thường cần thực hiện thêm một lần gọi đến endpoint service để lấy thông tin chi tiết của cơ sở kinh doanh.

API liên quan đến cơ sở kinh doanh  
Bảng dưới đây liệt kê các API liên quan đến cơ sở kinh doanh.  

| API | Chi tiết |
|-----|------|
| `GET /v1/businesses/:id` | Trả về thông tin chi tiết của cơ sở kinh doanh |
| `POST /v1/businesses` | Thêm cơ sở kinh doanh |
| `PUT /v1/businesses/:id` | Cập nhật thông tin chi tiết của cơ sở kinh doanh |
| `DELETE v1/businesses/:id` | Xóa cơ sở kinh doanh |

Bảng 1.2: API liên quan đến cơ sở kinh doanh

Nếu bạn quan tâm đến API tìm địa điểm/cơ sở kinh doanh trong thực tế, có thể xem hai ví dụ là Google Places API[7] và Yelp business endpoint[8].

### Mô hình dữ liệu
Trong phần này, chúng ta thảo luận về tỷ lệ đọc/ghi và thiết kế kiến trúc. Khả năng mở rộng của database sẽ được giới thiệu trong phần đi sâu.

**Tỷ lệ đọc/ghi**  
Lưu lượng đọc rất cao vì hai chức năng sau được sử dụng thường xuyên:
- Tìm cơ sở kinh doanh lân cận.
- Xem thông tin chi tiết của cơ sở kinh doanh.

Mặt khác, lưu lượng ghi thấp vì việc thêm, xóa và chỉnh sửa thông tin cơ sở kinh doanh không diễn ra thường xuyên.

Đối với hệ thống có lưu lượng đọc lớn, relational database như MySQL có thể là một lựa chọn tốt. Hãy xem kỹ hơn thiết kế kiến trúc.

**Kiến trúc dữ liệu**  
Các bảng database quan trọng là bảng cơ sở kinh doanh và bảng geo index.

**Bảng cơ sở kinh doanh**  
Bảng cơ sở kinh doanh chứa thông tin chi tiết về cơ sở kinh doanh. Như thể hiện trong Bảng 1.3, khóa chính là business_id.  
![Bảng cơ sở kinh doanh](../../images/v2/chapter01/Table1.3.png)  
Bảng 1.3: Bảng cơ sở kinh doanh

**Bảng geo index**  
Bảng geo index được dùng để xử lý hiệu quả các phép toán không gian. Vì bảng này cần một số kiến thức về geohash, chúng ta sẽ thảo luận về nó trong phần "Mở rộng database" ở trang 24.

### Thiết kế cấp cao
Sơ đồ thiết kế cấp cao được minh họa trong Hình 1.2. Hệ thống gồm hai phần: location-based service (LBS) và service liên quan đến cơ sở kinh doanh. Hãy xem từng component của hệ thống.  
![Thiết kế cấp cao](../../images/v2/chapter01/Figure1.2.png)  
Hình 1.2: Thiết kế cấp cao

#### Load balancer  
Load balancer tự động phân phối traffic đến giữa nhiều service. Thông thường, công ty cung cấp một DNS entry point duy nhất và định tuyến các API call nội bộ đến service phù hợp dựa trên URL path.

#### Location-based service (LBS)
Service LBS là phần cốt lõi của hệ thống, dùng để tìm các cơ sở kinh doanh lân cận trong phạm vi bán kính và vị trí đã cho. LBS có các đặc điểm sau:
- Đây là một service có lưu lượng đọc lớn và không có write request.
- QPS cao, đặc biệt trong giờ cao điểm ở các khu vực đông đúc.
- Service này stateless, nên rất dễ scale theo chiều ngang.

#### Service cơ sở kinh doanh
Service cơ sở kinh doanh chủ yếu xử lý hai loại request:
- Chủ cơ sở kinh doanh tạo, cập nhật hoặc xóa cơ sở kinh doanh. Đây chủ yếu là các write operation, QPS không cao.
- Khách hàng xem thông tin chi tiết của cơ sở kinh doanh. QPS cao trong giờ cao điểm.

#### Database cluster
Database cluster có thể dùng thiết lập master-slave. Trong thiết lập này, master database xử lý tất cả write operation, còn nhiều replica được dùng cho read operation. Dữ liệu trước tiên được lưu vào master database, sau đó được replicate sang các replica. Do replication lag, dữ liệu LBS đọc được và dữ liệu đã ghi vào master database có thể có một số khác biệt. Tính không nhất quán này thường không phải vấn đề vì thông tin cơ sở kinh doanh không cần được cập nhật theo thời gian thực.

#### Khả năng mở rộng của service cơ sở kinh doanh và LBS
Service cơ sở kinh doanh và LBS đều là stateless service, nên rất dễ tự động thêm server để xử lý traffic cao điểm (chẳng hạn giờ ăn) và loại bỏ server trong giờ thấp điểm (chẳng hạn giờ ngủ). Nếu hệ thống chạy trên cloud, chúng ta có thể thiết lập các region và availability zone khác nhau để tiếp tục cải thiện availability[9]. Chúng ta sẽ thảo luận chi tiết điều này trong phần đi sâu.

#### Thuật toán lấy cơ sở kinh doanh lân cận
Trong ứng dụng thực tế, công ty có thể dùng các geospatial database có sẵn như Geohash trong Redis[10] hoặc Postgres với extension PostGIS[11]. Trong phỏng vấn, bạn không cần biết nguyên lý bên trong của các geospatial database này. Tốt hơn hết là thể hiện khả năng giải quyết vấn đề và kiến thức kỹ thuật bằng cách giải thích cách geospatial index hoạt động, thay vì chỉ đơn giản liệt kê tên database.

Bước tiếp theo là khám phá các lựa chọn khác nhau để lấy cơ sở kinh doanh lân cận. Chúng ta sẽ liệt kê một số lựa chọn, xem lại quá trình suy nghĩ và thảo luận các trade-off.

Lựa chọn 1: Tìm kiếm hai chiều  
Cách trực quan nhưng đơn giản nhất để lấy các cơ sở kinh doanh lân cận là vẽ một vòng tròn có bán kính định trước và tìm tất cả cơ sở kinh doanh bên trong vòng tròn, như minh họa trong Hình 1.3.  
![Tìm kiếm hai chiều](../../images/v2/chapter01/Figure1.3.png)  
Hình 1.3: Tìm kiếm hai chiều

Quy trình này có thể được chuyển thành pseudo SQL query sau:
```sql
Select business_id, latitude, longitude FROM business
WHERE (latitude BETWEEN {:my_lat} - radius AND {:my_lat} + radius) 
AND (longitude BETWEEN {:my_long} - radius AND {:my_long} + radius)
```
Query này không hiệu quả vì chúng ta phải scan toàn bộ bảng.

Nếu tạo index trên các column kinh độ và vĩ độ thì sao? Điều đó có cải thiện hiệu quả không? Câu trả lời là không cải thiện nhiều. Vấn đề là chúng ta có dữ liệu hai chiều, và tập dữ liệu do mỗi chiều trả về vẫn có thể rất lớn. Ví dụ, như minh họa trong Hình 1.4, nhờ index trên các column kinh độ và vĩ độ, chúng ta có thể nhanh chóng truy xuất dataset 1 và dataset 2. Nhưng để lấy các cơ sở kinh doanh trong bán kính, chúng ta phải thực hiện phép giao trên hai dataset này. Cách này không hiệu quả vì mỗi dataset đều chứa một lượng lớn dữ liệu.  
![Phép giao của hai dataset](../../images/v2/chapter01/Figure1.4.png)  
Hình 1.4: Phép giao của hai dataset

Vấn đề của cách tiếp cận trên là database index chỉ có thể cải thiện tốc độ tìm kiếm ở một chiều. Vì vậy, câu hỏi tiếp theo một cách tự nhiên là liệu chúng ta có thể ánh xạ dữ liệu hai chiều thành một chiều hay không. Câu trả lời là có.

Trước khi tìm hiểu sâu hơn về câu trả lời, hãy xem các loại phương pháp indexing khác nhau.

Nói rộng ra, có hai loại phương pháp geospatial index như minh họa trong Hình 1.5. Chúng ta thảo luận chi tiết các thuật toán được highlight vì chúng thường được dùng trong ngành.

- Hash: Uniform grid, geohash, Cartesian Tier[12], v.v.
- Tree: Quadtree, Google S2, R-tree[13], v.v.  
![Các loại geospatial index khác nhau](../../images/v2/chapter01/Figure1.5.png)  
Hình 1.5: Các loại geospatial index khác nhau

Mặc dù implementation bên dưới của các phương pháp này khác nhau, ý tưởng cấp cao giống nhau, **đó là chia bản đồ thành các khu vực nhỏ hơn và xây dựng index để tìm kiếm nhanh**. Trong đó, geohash, quadtree và Google S2 được sử dụng rộng rãi nhất trong các ứng dụng thực tế. Hãy xem từng loại.

**Nhắc lại**  
Trong một buổi phỏng vấn thực tế, bạn thường không cần giải thích chi tiết implementation của các lựa chọn index. Tuy nhiên, hiểu nhu cầu về geospatial index, cách hoạt động cấp cao và những hạn chế của nó là rất quan trọng.

Lựa chọn 2: Chia đều thành grid  
Một cách đơn giản là chia thế giới thành các grid nhỏ có kích thước bằng nhau (Hình 1.6). Như vậy, một grid có thể chứa nhiều cơ sở kinh doanh và mỗi cơ sở kinh doanh trên bản đồ thuộc về một grid.  
![Bản đồ thế giới](../../images/v2/chapter01/Figure1.6.png)  
Hình 1.6: Bản đồ thế giới (nguồn:[14])

Phương pháp này có hiệu quả ở một mức độ nhất định, nhưng có một vấn đề chính: phân bố cơ sở kinh doanh không đồng đều. Trung tâm New York có thể có rất nhiều cơ sở kinh doanh, trong khi các grid khác ở sa mạc hoặc đại dương có thể hoàn toàn không có cơ sở kinh doanh. Bằng cách chia thế giới thành các grid có kích thước bằng nhau, chúng ta tạo ra một phân bố dữ liệu rất không đồng đều. Lý tưởng nhất là dùng grid có độ chi tiết cao hơn ở các khu vực đông đúc và grid lớn ở các khu vực thưa thớt. Một thách thức tiềm ẩn khác là tìm các grid lân cận của một grid cố định.

Lựa chọn 3: Geohash  
Geohash tốt hơn lựa chọn chia đều thành grid. Nó hoạt động bằng cách rút gọn dữ liệu kinh độ, vĩ độ hai chiều thành một chuỗi ký tự và chữ số một chiều. Thuật toán Geohash hoạt động bằng cách đệ quy chia thế giới thành các grid ngày càng nhỏ hơn, mỗi lần thêm một ký tự thì chia một lần. Hãy tìm hiểu ở mức cao cách geohash hoạt động.

Đầu tiên, chia Trái Đất thành bốn góc phần tư dọc theo kinh tuyến gốc và đường xích đạo.  
![Geohash](../../images/v2/chapter01/Figure1.7.png)  
Hình 1.7: Geohash

- Phạm vi vĩ độ (-90, 0] được biểu diễn bằng 0
- Phạm vi vĩ độ [0, 90] được biểu diễn bằng 1
- Phạm vi kinh độ (-180, 0] được biểu diễn bằng 0
- Phạm vi kinh độ [0, 180] được biểu diễn bằng 1

Bước hai, chia mỗi grid thành bốn grid nhỏ hơn. Mỗi grid có thể được biểu diễn bằng cách lần lượt sử dụng bit kinh độ và bit vĩ độ.
![Chia grid](../../images/v2/chapter01/Figure1.8.png)
Hình 1.8: Chia grid

Lặp lại quy trình chia nhỏ này cho đến khi kích thước grid đạt độ chính xác mong muốn. Geohash thường dùng biểu diễn base32[15]. Hãy xem hai ví dụ.
- Geohash của trụ sở Google (độ dài=6):  
1001 10110 01001 10000 11011 11010 (base32 nhị phân) -> 9q9hvu (base32)
- Geohash của trụ sở Facebook (độ dài=6):  
1001 10110 01001 10001 10000 10111 (base32 nhị phân) -> 9q9jhr (base32)

Geohash có 12 độ chính xác (còn gọi là level), như thể hiện trong Bảng 1.4. Hệ số độ chính xác quyết định kích thước grid. Chúng ta chỉ quan tâm đến geohash có độ dài từ 4 đến 6. Lý do là khi độ dài lớn hơn 6, grid quá nhỏ, còn khi độ dài nhỏ hơn 4, grid quá lớn (xem Bảng 1.4).  
![Ánh xạ từ độ dài Geohash đến kích thước grid](../../images/v2/chapter01/Table1.4.png)  
Bảng 1.4: Ánh xạ từ độ dài Geohash đến kích thước grid (nguồn:[16])

Làm thế nào để chọn độ chính xác phù hợp? Chúng ta muốn tìm độ dài geohash nhỏ nhất có thể bao phủ toàn bộ hình tròn được vẽ bởi bán kính do người dùng định nghĩa. Mối tương quan giữa bán kính và độ dài geohash được thể hiện trong bảng sau.  
![Ánh xạ từ bán kính đến geohash](../../images/v2/chapter01/Table1.5.png)  
Bảng 1.5: Ánh xạ từ bán kính đến geohash

Phương pháp này hoạt động tốt trong hầu hết trường hợp, nhưng chúng ta nên thảo luận với interviewer về một số edge case liên quan đến việc xử lý ranh giới geohash.

#### Vấn đề ranh giới
Geohash bảo đảm rằng hai geohash có prefix chung càng dài thì chúng càng gần nhau. Như minh họa trong Hình 1.9, tất cả grid đều có một prefix chung: 9q8zn.  
![Prefix chung](../../images/v2/chapter01/Figure1.9.png)  
Hình 1.9: Prefix chung

#### Vấn đề ranh giới 1
Tuy nhiên, điều ngược lại không đúng: hai vị trí có thể rất gần nhau nhưng hoàn toàn không có prefix chung. Điều này là do hai vị trí gần nhau nằm ở hai phía của đường xích đạo hoặc kinh tuyến gốc thuộc về hai "nửa" khác nhau của thế giới. Ví dụ, ở Pháp, La Roche-Chalais (geohash: U08) chỉ cách Pomerol (geohash: ezzz) 30 km, nhưng geohash của chúng hoàn toàn không có prefix chung[17].  
![Không có prefix chung](../../images/v2/chapter01/Figure1.10.png)  
Hình 1.10: Không có prefix chung

Do vấn đề ranh giới này, prefix SQL query đơn giản dưới đây sẽ không lấy được tất cả cơ sở kinh doanh lân cận.

```sql
SELECT * FROM geohash_index WHERE geohash LIKE '9q8zn%'
```

#### Vấn đề ranh giới 2
Một vấn đề ranh giới khác là hai vị trí có thể có prefix chung rất dài nhưng lại thuộc về các geohash khác nhau, như minh họa trong Hình 1.11.  
![Vấn đề ranh giới](../../images/v2/chapter01/Figure1.11.png)  
Hình 1.11: Vấn đề ranh giới

Một giải pháp phổ biến là không chỉ lấy tất cả cơ sở kinh doanh trong grid hiện tại mà còn lấy các cơ sở kinh doanh trong các grid lân cận. Geohash của các grid lân cận có thể được tính trong thời gian hằng số; có thể tìm thêm chi tiết tại đây[17].

#### Không đủ cơ sở kinh doanh
Bây giờ hãy giải quyết một vấn đề bổ sung. Nếu tổng số cơ sở kinh doanh trong grid hiện tại và tất cả grid lân cận vẫn không đủ thì sao?

Lựa chọn 1: Chỉ trả về các cơ sở kinh doanh trong bán kính.  
Lựa chọn này dễ triển khai, nhưng nhược điểm rất rõ ràng. Nó không thể trả về đủ kết quả để đáp ứng nhu cầu của người dùng.

Lựa chọn 2: Tăng bán kính tìm kiếm.  
Chúng ta có thể xóa chữ số cuối cùng của geohash và dùng geohash mới để lấy các cơ sở kinh doanh lân cận. Nếu số lượng cơ sở kinh doanh vẫn không đủ, chúng ta tiếp tục xóa thêm một chữ số để mở rộng phạm vi. Kích thước grid sẽ dần mở rộng cho đến khi số lượng kết quả vượt quá số lượng cần thiết. Hình 1.12 minh họa quá trình mở rộng tìm kiếm.  
![Quá trình mở rộng tìm kiếm](../../images/v2/chapter01/Figure1.12.png)  
Hình 1.12: Quá trình mở rộng tìm kiếm

Lựa chọn 4: Quadtree  
Một giải pháp phổ biến khác là quadtree. Quadtree[18] là một cấu trúc dữ liệu thường được dùng để phân vùng không gian hai chiều bằng cách đệ quy chia nó thành bốn góc phần tư (grid), cho đến khi nội dung của grid đáp ứng một số tiêu chí nhất định.

Ví dụ, tiêu chí có thể là tiếp tục chia nhỏ cho đến khi số lượng cơ sở kinh doanh trong grid không vượt quá 100. Con số này là tùy ý, con số thực tế có thể được xác định dựa trên yêu cầu nghiệp vụ. Với quadtree, chúng ta xây dựng một cấu trúc tree trong memory để trả lời query. Lưu ý rằng quadtree là một cấu trúc dữ liệu trong memory, không phải một giải pháp database. Nó chạy trên mỗi server LBS, và cấu trúc dữ liệu được xây dựng khi server khởi động.

Hình dưới đây minh họa quy trình khái niệm chia thế giới thành quadtree. Hãy giả sử thế giới chứa 200 triệu cơ sở kinh doanh.  
![Quadtree](../../images/v2/chapter01/Figure1.13.png)  
Hình 1.13: Quadtree

Hình 1.14 giải thích chi tiết hơn quy trình xây dựng quadtree. Root node đại diện cho toàn bộ bản đồ thế giới. Root node được phân rã đệ quy thành 4 góc phần tư cho đến khi không còn node nào chứa hơn 100 cơ sở kinh doanh.  
![Xây dựng quadtree](../../images/v2/chapter01/Figure1.14.png)  
Hình 1.14: Xây dựng quadtree

Pseudo-code xây dựng quadtree như sau:

```java
public void buildQuadtree(TreeNode node) {
    if (countNumberOfBusinessesInCurrentGrid(node) > 100) {
        node.subdivide();
        for (TreeNode child : node.getChildren()) {
            buildQuadtree(child);
        }
    }
}
```

#### Cần bao nhiêu memory để lưu toàn bộ quadtree?
Để trả lời câu hỏi này, chúng ta cần biết sẽ lưu loại dữ liệu nào.

#### Dữ liệu trên leaf node
![Leaf node](../../images/v2/chapter01/Table1.6.png)  
Bảng 1.6: Leaf node

Dữ liệu trên internal node  
![Internal node](../../images/v2/chapter01/Table1.7.png)  
Bảng 1.7: Internal node

Mặc dù quy trình xây dựng tree phụ thuộc vào số lượng cơ sở kinh doanh trong grid, con số này không cần được lưu trong quadtree node vì có thể suy ra từ các record trong database.

Bây giờ chúng ta đã biết cấu trúc dữ liệu của mỗi node, hãy xem mức sử dụng memory.
- Mỗi grid có thể lưu tối đa 100 cơ sở kinh doanh
- Số lượng leaf node = ~200 triệu/100 = ~2 triệu
- Số lượng internal node = 2 triệu×1/3 = ~670 nghìn. Nếu bạn không biết tại sao số lượng internal node bằng một phần ba số lượng leaf node, hãy đọc tài liệu tham khảo[19]
- Tổng memory cần thiết = 2 triệu×832 byte + 670 nghìn×64 byte = ~1.71GB. Ngay cả khi thêm một phần overhead để xây dựng tree, memory cần thiết để xây dựng tree vẫn khá nhỏ.

Trong một buổi phỏng vấn thực tế, chúng ta không cần tính toán chi tiết đến vậy. Điểm chính ở đây là quadtree index không chiếm quá nhiều memory và có thể dễ dàng đặt trên một server.

Điều đó có nghĩa là chúng ta chỉ nên dùng một server để lưu quadtree index phải không? Câu trả lời là không. Tùy vào lưu lượng đọc, một quadtree server đơn lẻ có thể không có đủ CPU hoặc network bandwidth để phục vụ tất cả read request. Nếu vậy, cần phân tán read load giữa nhiều quadtree server.

#### Xây dựng toàn bộ quadtree mất bao lâu?
Mỗi leaf node chứa khoảng 100 business ID. Độ phức tạp thời gian để xây dựng tree là $\frac{n}{100}$ log $\frac{n}{100}$, trong đó n là tổng số cơ sở kinh doanh. Với 200 triệu cơ sở kinh doanh, có thể mất vài phút để xây dựng toàn bộ quadtree.

#### Dùng quadtree để lấy các cơ sở kinh doanh lân cận như thế nào?
1. Xây dựng quadtree trong memory.
2. Sau khi xây dựng quadtree xong, bắt đầu từ root, tìm kiếm và duyệt tree cho đến khi tìm thấy leaf node chứa search origin. Nếu leaf node đó có 100 cơ sở kinh doanh, trả về node đó. Nếu không, thêm cơ sở kinh doanh từ các node lân cận cho đến khi trả về đủ số lượng cơ sở kinh doanh.

Cân nhắc vận hành đối với quadtree
Như đã đề cập ở trên, với 200 triệu cơ sở kinh doanh, việc xây dựng quadtree khi server khởi động có thể mất vài phút. Việc cân nhắc ảnh hưởng vận hành của thời gian khởi động server dài như vậy là rất quan trọng. Trong thời gian xây dựng quadtree, server không thể xử lý traffic. Vì vậy, chúng ta nên triển khai phiên bản server mới từng bước cho một phần nhỏ server. Cách này tránh làm phần lớn server cluster offline và gây gián đoạn service. Blue/green deployment[20] cũng có thể được sử dụng, nhưng việc toàn bộ server cluster mới đồng thời lấy 200 triệu cơ sở kinh doanh từ database service có thể gây áp lực lớn lên hệ thống. Có thể làm như vậy, nhưng thiết kế sẽ phức tạp hơn, và bạn nên đề cập điểm này trong buổi phỏng vấn.

Một cân nhắc vận hành khác là cập nhật quadtree như thế nào khi các cơ sở kinh doanh được thêm và xóa theo thời gian. Cách đơn giản nhất là xây dựng lại quadtree từng bước trên toàn cluster, mỗi lần chỉ xây dựng lại một phần nhỏ server. Tuy nhiên, điều này có nghĩa là một số server sẽ trả về dữ liệu cũ trong thời gian ngắn. Dựa trên yêu cầu, đây thường là một trade-off có thể chấp nhận. Có thể giảm nhẹ hơn nữa bằng cách thiết lập thỏa thuận nghiệp vụ rằng các cơ sở kinh doanh mới được thêm/cập nhật sẽ có hiệu lực vào ngày hôm sau. Điều đó có nghĩa là chúng ta có thể dùng một job chạy ban đêm để cập nhật cache. Một vấn đề tiềm ẩn của phương pháp này là một lượng lớn key sẽ hết hạn cùng lúc, khiến cache server chịu tải quá lớn.

Cũng có thể cập nhật quadtree động khi cơ sở kinh doanh được thêm và xóa. Điều này dĩ nhiên khiến thiết kế phức tạp hơn, đặc biệt nếu cấu trúc dữ liệu quadtree có thể được nhiều thread truy cập. Khi đó cần một cơ chế locking, và cơ chế này có thể làm implementation quadtree phức tạp hơn đáng kể.

#### Ví dụ thực tế về quadtree
Yext[21] cung cấp một hình ảnh (Hình 1.15) cho thấy quadtree được xây dựng quanh Denver[21]. Chúng ta muốn dùng grid nhỏ hơn, chi tiết hơn ở các khu vực đông đúc và grid lớn hơn ở các khu vực thưa thớt.  
![Ví dụ thực tế về quadtree](../../images/v2/chapter01/Figure1.15.png)  
Hình 1.15: Ví dụ thực tế về quadtree

Lựa chọn 5: Google S2  
Google S2 Geometry Library[22] là một thành phần quan trọng khác trong lĩnh vực này. Tương tự quadtree, đây là một giải pháp trong memory. Nó ánh xạ hình cầu thành một index 1D dựa trên đường cong Hilbert (một space-filling curve)[23]. Đường cong Hilbert có một thuộc tính rất quan trọng: hai điểm gần nhau trên đường cong Hilbert cũng gần nhau trong không gian 1D (Hình 1.16). Tìm kiếm trong không gian 1D hiệu quả hơn nhiều so với tìm kiếm trong không gian 2D. Người đọc quan tâm có thể dùng online tool[24] để trải nghiệm đường cong Hilbert.  
![Đường cong Hilbert](../../images/v2/chapter01/Figure1.16.png)  
Hình 1.16: Đường cong Hilbert (nguồn:[24])

S2 là một library phức tạp, bạn không cần giải thích nguyên lý bên trong của nó trong buổi phỏng vấn. Tuy nhiên, vì nó được sử dụng rộng rãi ở Google, Tinder và các công ty khác, chúng ta sẽ giới thiệu ngắn gọn những ưu điểm của nó.
- S2 rất phù hợp cho geofencing vì có thể phủ một khu vực bất kỳ bằng các level khác nhau (Hình 1.17). Theo Wikipedia, "geofence là một ranh giới ảo cho một khu vực địa lý thực. Geofence có thể được tạo động - chẳng hạn một bán kính lấy vị trí điểm làm tâm, hoặc geofence có thể là một tập hợp ranh giới được định nghĩa trước (chẳng hạn khu vực trường học hoặc ranh giới khu phố)"[25].
Geofencing cho phép chúng ta định nghĩa ranh giới xung quanh khu vực quan tâm và gửi thông báo cho người dùng rời khỏi khu vực đó. Điều này có thể cung cấp nhiều chức năng hơn so với chỉ trả về các cơ sở kinh doanh lân cận.  
![Geofence](../../images/v2/chapter01/Figure1.17.png)  
Hình 1.17: Geofence

- Một ưu điểm khác của S2 là thuật toán region covering[26]. Không giống level (độ chính xác) cố định trong geohash, trong S2 chúng ta có thể chỉ định level tối thiểu, level tối đa và số cell tối đa. Vì kích thước cell linh hoạt, kết quả S2 trả về chi tiết hơn. Nếu muốn tìm hiểu thêm, bạn có thể xem S2 tool[26].

Khuyến nghị
Để tìm kiếm hiệu quả các cơ sở kinh doanh lân cận, chúng ta đã thảo luận một số lựa chọn: geohash, quadtree và S2. Như thể hiện trong Bảng 1.8, các công ty hoặc công nghệ khác nhau sử dụng các lựa chọn khác nhau.  
![Các loại geospatial index khác nhau](../../images/v2/chapter01/Table1.8.png)  
Bảng 1.8: Các loại geospatial index khác nhau

Trong buổi phỏng vấn, chúng tôi khuyến nghị chọn geohash hoặc quadtree vì S2 quá phức tạp và khó giải thích rõ ràng trong buổi phỏng vấn.

Geohash so với quadtree
Trước khi kết thúc phần này, hãy nhanh chóng so sánh geohash và quadtree.

Geohash
- Dễ sử dụng và triển khai. Không cần xây dựng tree.
- Hỗ trợ trả về các cơ sở kinh doanh trong bán kính được chỉ định.
- Khi độ chính xác (level) của geohash cố định, kích thước grid cũng cố định. Nó không thể tự động điều chỉnh kích thước grid dựa trên mật độ dân số. Cần logic phức tạp hơn để hỗ trợ điều này.
- Dễ cập nhật index. Ví dụ, để xóa một cơ sở kinh doanh khỏi index, chúng ta chỉ cần xóa nó khỏi row tương ứng có cùng geohash và business_id. Xem ví dụ cụ thể trong Hình 1.18.  
![Xóa cơ sở kinh doanh](../../images/v2/chapter01/Figure1.18.png)  
Hình 1.18: Xóa cơ sở kinh doanh

Quadtree
- Implementation phức tạp hơn một chút vì cần xây dựng tree.
- Hỗ trợ lấy k cơ sở kinh doanh gần nhất. Đôi khi chúng ta chỉ muốn trả về k cơ sở kinh doanh gần nhất và không quan tâm cơ sở kinh doanh có nằm trong bán kính chỉ định hay không. Ví dụ, khi đang đi du lịch mà xe sắp hết xăng, bạn chỉ muốn tìm trạm xăng gần nhất. Các trạm xăng này có thể không ở gần bạn, nhưng ứng dụng cần trả về k kết quả gần nhất. Với loại query này, quadtree là một lựa chọn tốt vì quy trình chia nhỏ của nó dựa trên số lượng và có thể tự động điều chỉnh phạm vi query cho đến khi trả về k kết quả.
- Có thể tự động điều chỉnh kích thước grid dựa trên mật độ dân số (xem ví dụ Denver trong Hình 1.15).
- Cập nhật index phức tạp hơn geohash. Quadtree là một cấu trúc tree. Nếu muốn xóa một cơ sở kinh doanh, chúng ta cần duyệt từ root node đến leaf node để xóa cơ sở kinh doanh đó. Ví dụ, nếu muốn xóa cơ sở kinh doanh có ID=2, chúng ta phải duyệt từ root node đến tận leaf node, như minh họa trong Hình 1.19. Độ phức tạp thời gian cập nhật index là O(log n), nhưng nếu cấu trúc dữ liệu được một chương trình multi-thread truy cập thì implementation sẽ phức tạp vì cần locking. Ngoài ra, việc rebalance tree cũng có thể phức tạp. Ví dụ, khi leaf node không còn chỗ chứa cơ sở kinh doanh mới được thêm vào thì cần rebalance. Một giải pháp có thể là over-allocate phạm vi.  
![Cập nhật quadtree](../../images/v2/chapter01/Figure1.19.png)  
Hình 1.19: Cập nhật quadtree

## Bước 3 - Thiết kế chi tiết
Đến đây, bạn đã có một hiểu biết tốt về toàn bộ hệ thống. Bây giờ hãy đi sâu vào một số lĩnh vực:
- Mở rộng database
- Cache
- Region và availability zone
- Lọc kết quả theo thời gian hoặc loại cơ sở kinh doanh
- Sơ đồ kiến trúc cuối cùng

### Mở rộng database
Chúng ta sẽ thảo luận cách scale hai bảng quan trọng nhất: bảng cơ sở kinh doanh và bảng geospatial index.

Bảng cơ sở kinh doanh  
Dữ liệu của bảng cơ sở kinh doanh có thể không chứa vừa trên một server, vì vậy đây là một ứng viên tốt để shard. Cách đơn giản nhất là shard theo business_id. Scheme sharding này bảo đảm load được phân bố đều giữa tất cả shard và rất dễ duy trì về mặt vận hành.

Bảng geospatial index  
Geohash và quadtree đều được sử dụng rộng rãi. Vì geohash đơn giản, chúng ta dùng nó làm ví dụ. Có hai cách để xây dựng bảng.

Lựa chọn 1: Với mỗi key geohash, có một JSON array chứa các business_id trong một row. Điều này có nghĩa là tất cả business_id trong một geohash được lưu trên cùng một row.

![list_of_business_ids là một JSON array](../../images/v2/chapter01/Table1.9.png)  
Bảng 1.9: list_of_business_ids là một JSON array

Lựa chọn 2: Nếu có nhiều cơ sở kinh doanh trong cùng một geohash, sẽ có nhiều row, mỗi cơ sở kinh doanh một row. Điều này có nghĩa là các business_id khác nhau trong cùng một geohash được lưu trên các row khác nhau.

![business_id là một ID đơn](../../images/v2/chapter01/Table1.10.png)  
Bảng 1.10: business_id là một ID đơn

Dưới đây là một số row mẫu của lựa chọn 2.  
![Các row mẫu của bảng geospatial index](../../images/v2/chapter01/Table1.11.png)  
Bảng 1.11: Các row mẫu của bảng geospatial index

Khuyến nghị: Chúng tôi khuyến nghị lựa chọn 2 vì các lý do sau:
Với lựa chọn 1, để cập nhật một cơ sở kinh doanh, chúng ta cần lấy business_id array và scan toàn bộ array để tìm cơ sở kinh doanh cần cập nhật. Khi chèn cơ sở kinh doanh mới, chúng ta phải scan toàn bộ array để bảo đảm không có duplicate. Chúng ta cũng cần lock row để ngăn các cập nhật đồng thời. Có rất nhiều edge case cần xử lý.
Với lựa chọn 2, nếu có một composite key gồm hai column (geohash, business_id), việc thêm và xóa cơ sở kinh doanh rất đơn giản. Không cần lock bất cứ thứ gì.

Scale geospatial index  
Một sai lầm phổ biến khi scale geospatial index là vội áp dụng sharding scheme trước khi xem xét kích thước dữ liệu thực tế của bảng. Trong trường hợp của chúng ta, toàn bộ dataset của bảng geospatial index không lớn (quadtree index chỉ cần 1.71G memory, yêu cầu lưu trữ của geohash index cũng tương tự). Toàn bộ geospatial index có thể dễ dàng nằm trong working set của một database server hiện đại. Tuy nhiên, tùy vào lưu lượng đọc, một database server đơn lẻ có thể không có đủ CPU hoặc network bandwidth để xử lý tất cả read request. Nếu vậy, cần phân tán read load giữa nhiều database server.

Có hai cách tổng quát để phân tán load của relational database server. Chúng ta có thể thêm read replica hoặc shard database.

Nhiều engineer thích nói về sharding trong phỏng vấn. Tuy nhiên, đây có thể không phải lựa chọn tốt cho geohash table vì sharding phức tạp. Ví dụ, sharding logic phải được thêm vào application layer. Đôi khi sharding là lựa chọn duy nhất. Nhưng trong trường hợp này, mọi thứ đều có thể nằm trong working set của database server, nên không có lý do kỹ thuật mạnh mẽ để shard dữ liệu trên nhiều server.

Trong trường hợp này, cách tốt hơn là dùng một loạt read replica để xử lý read load. Cách này đơn giản hơn nhiều trong phát triển và bảo trì. Vì vậy, nên scale geospatial index table bằng replica.

### Cache
Trước khi đưa cache layer vào, chúng ta phải tự hỏi liệu mình có thực sự cần cache layer hay không.

Việc cache có mang lại lợi thế rõ ràng hay không vẫn chưa rõ:
- Workload thiên về đọc và dataset tương đối nhỏ. Dữ liệu có thể nằm trong working set của mọi database server hiện đại. Vì vậy, query không bị giới hạn bởi I/O và tốc độ chạy gần như sẽ nhanh bằng memory cache.
- Nếu read performance trở thành bottleneck, chúng ta có thể thêm database read replica để tăng read throughput.

Hãy thận trọng khi thảo luận về cache với interviewer vì cần benchmark và phân tích chi phí cẩn thận. Nếu nhận thấy cache thực sự phù hợp với yêu cầu nghiệp vụ, bạn có thể tiếp tục thảo luận chiến lược cache.

Cache key  
Lựa chọn cache key trực tiếp nhất là tọa độ vị trí của người dùng (vĩ độ và kinh độ). Tuy nhiên, lựa chọn này có một số vấn đề:
- Tọa độ vị trí do điện thoại trả về không chính xác vì chúng chỉ là ước tính tốt nhất[32]. Ngay cả khi không di chuyển, mỗi lần lấy tọa độ trên điện thoại, kết quả cũng có thể hơi khác nhau.
- Người dùng có thể di chuyển từ vị trí này sang vị trí khác, khiến tọa độ vị trí thay đổi một chút. Với hầu hết ứng dụng, thay đổi này không quan trọng.

Vì vậy, tọa độ vị trí không phải cache key tốt. Lý tưởng nhất là những thay đổi nhỏ về vị trí vẫn nên ánh xạ đến cùng một cache key. Các giải pháp geohash/quadtree đã đề cập trước đó xử lý rất tốt vấn đề này vì tất cả cơ sở kinh doanh trong một grid đều được ánh xạ đến cùng một geohash.

Loại dữ liệu cần cache  
Như thể hiện trong Bảng 1.12, có hai loại dữ liệu có thể cache để cải thiện performance tổng thể của hệ thống:  
![Cặp key-value trong cache](../../images/v2/chapter01/Table1.12.png)  
Bảng 1.12: Cặp key-value trong cache

Danh sách business ID trong grid  
Vì dữ liệu cơ sở kinh doanh tương đối ổn định, chúng ta tính trước danh sách business ID của một geohash cụ thể và lưu nó trong key-value store như Redis. Hãy xem một ví dụ cụ thể về việc bật cache để lấy các cơ sở kinh doanh lân cận.

1. Lấy danh sách business ID của một geohash đã cho.
SELECT business_id FROM geohash_index WHERE geohash LIKE '{geohash}%'

2. Nếu cache miss, lưu kết quả vào Redis cache.
```java
public List<String> getNearbyBusinessIds(String geohash) {
    String cacheKey = hash(geohash);
    List<String> listOfBusinessIds = Redis.get(cacheKey);
    if (listOfBusinessIds == null) {
        listOfBusinessIds = Run the select SQL query above;
        Cache.set(cacheKey, listOfBusinessIds, "1d");
    }
    return listOfBusinessIds;
}
```

Khi cơ sở kinh doanh mới được thêm, chỉnh sửa hoặc xóa, database sẽ được cập nhật và cache bị invalidate. Vì số lượng các thao tác này tương đối nhỏ và phương pháp geohash không cần cơ chế locking, các thao tác cập nhật dễ xử lý.

Theo yêu cầu, người dùng có thể chọn 4 bán kính sau ở client: 500m, 1km, 2km và 5km. Các bán kính này lần lượt ánh xạ đến geohash có độ dài 4, 5, 5 và 6. Để nhanh chóng lấy các cơ sở kinh doanh lân cận với các bán kính khác nhau, chúng ta cache dữ liệu của cả ba độ chính xác (geohash_4, geohash_5 và geohash_6) trong Redis.

Như đã đề cập, chúng ta có 200 triệu cơ sở kinh doanh, mỗi cơ sở kinh doanh thuộc về 1 grid ở một độ chính xác nhất định. Tổng memory cần thiết là:
- Storage cho Redis value: 8 byte×200 triệu×3 độ chính xác = ~5GB
- Storage cho Redis key: không đáng kể
- Tổng memory cần thiết: ~5GB

Xét về mức sử dụng memory, chúng ta có thể dùng một Redis server hiện đại, nhưng để bảo đảm availability cao và giảm latency giữa các châu lục, chúng ta triển khai Redis cluster trên toàn cầu. Xét đến kích thước dữ liệu ước tính, chúng ta có thể triển khai các bản sao cache giống nhau trên toàn cầu. Trong sơ đồ kiến trúc cuối cùng (Hình 1.21), chúng ta gọi Redis cache này là "Geohash".

Dữ liệu cơ sở kinh doanh cần để render trang client  
Cache loại dữ liệu này rất đơn giản. Key là business_id, value là business object chứa tên cơ sở kinh doanh, địa chỉ, URL hình ảnh, v.v. Trong sơ đồ kiến trúc cuối cùng (Hình 1.21), chúng ta gọi Redis cache này là "Business info".

Region và availability zone  
Chúng ta triển khai location-based service trên nhiều region và availability zone, như minh họa trong Hình 1.20. Cách này có một số ưu điểm:
- Khiến hệ thống "gần" người dùng hơn về mặt vật lý. Người dùng ở miền tây Hoa Kỳ kết nối đến data center trong region đó, còn người dùng ở châu Âu kết nối đến data center ở châu Âu.
- Cho phép chúng ta phân tán traffic đều một cách linh hoạt dựa trên dân số. Một số khu vực như Nhật Bản và Hàn Quốc có mật độ dân số cao. Có thể nên đặt chúng trong một region riêng, hoặc thậm chí triển khai location-based service trên nhiều availability zone để phân tán load.
- Luật về quyền riêng tư. Một số quốc gia có thể yêu cầu dữ liệu người dùng được sử dụng và lưu trữ tại địa phương. Trong trường hợp đó, chúng ta có thể thiết lập một region tại quốc gia đó và dùng DNS routing để giới hạn tất cả request từ quốc gia đó trong region này.  
![Triển khai LBS "gần" người dùng hơn](../../images/v2/chapter01/Figure1.20.png)  
Hình 1.20: Triển khai LBS "gần" người dùng hơn

Câu hỏi tiếp theo: lọc kết quả theo thời gian hoặc loại cơ sở kinh doanh  
Interviewer có thể hỏi một câu hỏi tiếp theo: làm thế nào để trả về các cơ sở kinh doanh đang mở cửa hoặc chỉ trả về các cơ sở kinh doanh loại nhà hàng?

Candidate: Khi thế giới được chia thành các grid nhỏ bằng geohash hoặc quadtree, số lượng cơ sở kinh doanh trong kết quả tìm kiếm tương đối nhỏ. Vì vậy, chấp nhận được việc trước tiên trả về business ID, sau đó bổ sung business object và lọc theo giờ hoạt động hoặc loại cơ sở kinh doanh. Giải pháp này giả định giờ hoạt động và loại cơ sở kinh doanh được lưu trong bảng cơ sở kinh doanh.

### Sơ đồ thiết kế cuối cùng
Kết hợp tất cả nội dung, chúng ta có sơ đồ thiết kế sau.  
![Sơ đồ thiết kế](../../images/v2/chapter01/Figure1.21.png)  
Hình 1.21: Sơ đồ thiết kế

Lấy cơ sở kinh doanh lân cận  
1. Bạn thử tìm nhà hàng trong phạm vi 500 mét trên Yelp. Client gửi vị trí người dùng (vĩ độ=37.776720, kinh độ=-122.416730) và bán kính (500m) đến load balancer.
2. Load balancer chuyển tiếp request đến LBS.
3. Dựa trên thông tin vị trí và bán kính của người dùng, LBS tìm độ dài geohash phù hợp với search. Tra Bảng 1.5, 500m tương ứng với geohash có độ dài=6.
4. LBS tính các geohash lân cận và thêm chúng vào list. Kết quả có dạng như sau:
list_of_geohashes = [my_geohash， neighbor1_geohash， neighbor2_geohash， ...， neighbor8_geohash].
5. Với mỗi geohash trong list_of_geohashes, LBS gọi Redis server "Geohash" để lấy business ID tương ứng. Có thể thực hiện song song các call lấy business ID của từng geohash để giảm latency.
6. Dựa trên list business ID được trả về, LBS lấy đầy đủ thông tin cơ sở kinh doanh từ Redis server "Business info", sau đó tính khoảng cách giữa người dùng và cơ sở kinh doanh, sắp xếp chúng rồi trả kết quả về client.

Xem, cập nhật, thêm hoặc xóa cơ sở kinh doanh  
Tất cả API liên quan đến cơ sở kinh doanh đều tách biệt với LBS. Để xem thông tin chi tiết của cơ sở kinh doanh, business service trước tiên kiểm tra xem dữ liệu có được lưu trong Redis cache "Business info" hay không. Nếu có, dữ liệu trong cache được trả về client. Nếu không, dữ liệu được lấy từ database cluster và lưu vào Redis cache, cho phép các request sau lấy kết quả trực tiếp từ cache.

Vì chúng ta có một thỏa thuận nghiệp vụ từ trước, các cơ sở kinh doanh mới được thêm/cập nhật sẽ có hiệu lực vào ngày hôm sau, và dữ liệu cơ sở kinh doanh trong cache được cập nhật bởi job chạy ban đêm.

## Bước 4 - Tóm tắt
Trong chương này, chúng ta đã giới thiệu thiết kế dịch vụ địa điểm lân cận. Hệ thống này là một LBS điển hình sử dụng geospatial index. Chúng ta đã thảo luận một số lựa chọn index:
- Tìm kiếm hai chiều
- Chia đều thành grid
- Geohash
- Quadtree
- Google S2

Geohash, quadtree và S2 được các công ty công nghệ khác nhau sử dụng rộng rãi. Chúng ta chọn geohash làm ví dụ để minh họa cách geospatial index hoạt động.

Trong phần đi sâu, chúng ta đã thảo luận lý do cache hiệu quả trong việc giảm latency, nên cache những gì và dùng cache như thế nào để nhanh chóng lấy các cơ sở kinh doanh lân cận. Chúng ta cũng đã thảo luận cách scale database bằng replication và sharding.

Sau đó, chúng ta nghiên cứu việc triển khai LBS trên các region và availability zone khác nhau để cải thiện availability, đưa server đến gần người dùng hơn về mặt vật lý và tuân thủ tốt hơn luật về quyền riêng tư tại địa phương.

Chúc mừng bạn đã đi đến đây! Hãy tự động viên mình một chút. Làm tốt lắm!

Tóm tắt chương  
![summary.png](../../images/v2/chapter01/summary.png)


## Tài liệu tham khảo
[1] Yelp. https://www.yelp.com/  
[2] Tile bản đồ của Stamen Design. http://maps.stamen.com/  
[3] OpenStreetMap. https://www.openstreetmap.org  
[4] GDPR. https://en.wikipedia.org/wiki/General_Data_Protection_Regulation  
[5] CCPA. https://en.wikipedia.org/wiki/California_Consumer_Privacy_Act  
[6] Phân trang trong REST API. https://developer.atlassian.com/server/confluence/  pagination-in-the-rest-api/  
[7] Google places API. https://developers.google.com/maps/documentation/places/web-service/search  
[8] Yelp business endpoint. https://www.yelp.com/developers/documentation/v3/business_search  
[9] Region và availability zone. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html  
[10] Redis GEOHASH. https://redis.io/commands/GEOHASH  
[11] POSTGIS. https://postgis.net/  
[12] Cartesian Tier. http://www.nsshutdown.com/projects/lucene/whitepaper/locallucene_v2.html  
[13] R-tree. https://en.wikipedia.org/wiki/R-tree  
[14] Bản đồ thế giới trong hệ quy chiếu tọa độ địa lý. https://bit.ly/3DsjAwg  
[15] Base32. https://en.wikipedia.org/wiki/Base32  
[16] Tổng hợp grid Geohash. https://bit.ly/3kK146  
[17] Geohash. https://www.movable-type.co.uk/scripts/geohash.html  
[18] Quadtree. https://en.wikipedia.org/wiki/Quadtree  
[19] Quadtree có bao nhiêu leaf. https://stackoverflow.com/questions/35976444/how-many-leaves-has-a-quadtree  
[20] Blue-green deployment. https://martinfowler.com/bliki/BlueGreenDeployment.html  
[21] Cải thiện location cache bằng quadtree. https://engblog.yext.com/post/geolocation-caching  
[22] S2. https://s2geometry.io/  
[23] Đường cong Hilbert. https://en.wikipedia.org/wiki/Hilbert_curve  
[24] Hilbert mapping. http://bit-player.org/extras/hilbert/hilbert-mapping.html  
[25] Geofence. https://en.wikipedia.org/wiki/Geo-fence  
[26] Region covering. https://s2.sidewalklabs.com/regioncoverer/  
[27] Bing Maps. https://bit.ly/30ytSfG  
[28] MongoDB. https://docs.mongodb.com/manual/tutorial/build-a-2d-index/  
[29] Geospatial index: Kiến trúc Redis hỗ trợ 10 triệu QPS mỗi giây cho Lyft. https://www.youtube.com/watch?v=cSFWIF96Sds&t=2155s  
[30] Geoshape type. https://www.elastic.co/guide/en/elasticsearch/reference/1.6/mapping-geo-shape-type.html  
[31] Khuyến nghị geosharding phần 1: Sharding approach. https://medium.com/tinder-engineering/geosharded-recommendations-part-1-sharding-approach-d5d540ec77a  
[32] Lấy vị trí gần nhất đã biết. https://developer.android.com/training/location/retrieve-current#Challenges  
