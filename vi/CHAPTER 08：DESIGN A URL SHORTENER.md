# Chương 08: Thiết kế dịch vụ rút gọn URL


Trong chương này, chúng ta sẽ giải một bài toán phỏng vấn system design thú vị và kinh điển: thiết kế một dịch vụ rút gọn URL giống như tinyurl.

### Bước 1: Tìm hiểu bài toán và xác định phạm vi thiết kế

Các câu hỏi phỏng vấn về system design vốn được cố ý để mở. Để thiết kế một hệ thống được xây dựng tốt, điều quan trọng là phải làm rõ bài toán.

Ứng viên: Bạn có thể cho một ví dụ để giải thích URL shortener hoạt động như thế nào không?

Người phỏng vấn: Giả sử URL `https://www.systeminterview.com/q=chatsystem&c=loggedin&v=v3&l=long` là URL gốc. Dịch vụ của bạn tạo ra một alias ngắn hơn: `https://tinyurl.com/y7keocwj`. Nếu bạn nhấp vào URL alias ngắn hơn, nó sẽ chuyển hướng bạn đến URL gốc.

Ứng viên: Lưu lượng là bao nhiêu?

Người phỏng vấn: Mỗi ngày tạo ra 100 triệu [URL](https://www.notion.so/f56f4bc43ae9455780d5c541cb762a83).

Ứng viên: URL sau khi rút gọn dài bao nhiêu?

Người phỏng vấn: Càng ngắn càng tốt.

Ứng viên: URL rút gọn được phép dùng những ký tự nào?

Người phỏng vấn: URL rút gọn có thể là tổ hợp của chữ số (0-9) và ký tự (a-z, A-Z).

Ứng viên: URL rút gọn có thể bị xóa hoặc cập nhật không?

Người phỏng vấn: Để đơn giản, hãy giả sử URL rút gọn không thể bị xóa hoặc cập nhật.

Dưới đây là các use case cơ bản:

1. Rút gọn URL: Cho một URL dài => trả về một URL ngắn hơn nhiều
2. Chuyển hướng URL: Cho một URL ngắn => chuyển hướng đến URL ban đầu
3. Các cân nhắc về high availability, khả năng mở rộng và fault tolerance

#### Ước tính sơ bộ quy mô hệ thống

* Ghi: Mỗi ngày tạo ra 100 triệu URL.
* Số thao tác ghi mỗi giây: 100 triệu/24/3600 = 1160
* Đọc: giả sử tỷ lệ đọc và ghi là 10:1, số thao tác đọc mỗi giây: 1160 \* 10 = 11,600
* Giả sử dịch vụ rút gọn URL sẽ chạy trong 10 năm, điều đó có nghĩa là chúng ta phải hỗ trợ 100 triệu \* 365 \* 10 = 365 tỷ bản ghi.
* Giả sử độ dài URL trung bình là 100.
* Nhu cầu lưu trữ trong 10 năm: 365 tỷ \* 100 byte \* 10 năm = 365 TB

Điều quan trọng là bạn phải cùng người phỏng vấn thảo luận về các giả định và phép tính, để cả hai cùng có chung một cơ sở.

### Bước 2: Đề xuất thiết kế cấp cao và nhận được sự đồng thuận

Trong phần này, chúng ta sẽ thảo luận về các API endpoint, chuyển hướng URL và rút gọn URL.

#### API endpoint

API endpoint thúc đẩy việc giao tiếp giữa client và server. Chúng ta sẽ thiết kế các API theo phong cách REST. Nếu bạn chưa quen với RESTful API, bạn có thể tham khảo tài liệu bên ngoài, chẳng hạn tài liệu trong phần tham khảo \[1]. Một URL shortener chủ yếu cần hai API endpoint.

1.  Rút gọn URL. Để tạo một URL ngắn mới, client gửi một POST request chứa một tham số: URL dài ban đầu. API như sau:

    **POST api/v1/data/shorten**

    * Tham số request: {longUrl: longURLString}.
    * Trả về shortURL
2.  Chuyển hướng URL. Để chuyển hướng một URL ngắn đến URL dài tương ứng, client gửi một GET request. API như sau:

    **GET api/v1/shortUrl**

    * Trả về longURL để thực hiện HTTP redirect

#### Chuyển hướng URL

Hình 8-1 cho thấy điều gì xảy ra khi bạn nhập một tinyurl trên trình duyệt. Ngay khi server nhận được request tinyurl, nó sẽ dùng redirect 301 để chuyển URL ngắn thành URL dài.

![](images/chapter8/figure8-1.jpg)

Chi tiết giao tiếp giữa client và server được thể hiện trong Hình 8-2.

![](images/chapter8/figure8-2.jpg)

Một điểm đáng thảo luận ở đây là sự khác nhau giữa redirect 301 và redirect 302.

* **Redirect 301**. Redirect 301 cho biết URL được yêu cầu đã được chuyển "vĩnh viễn" sang URL dài. Vì là chuyển hướng vĩnh viễn, trình duyệt sẽ cache response, và các request tiếp theo đến cùng URL sẽ không được gửi đến dịch vụ rút gọn URL. Thay vào đó, request sẽ được chuyển hướng trực tiếp đến server của URL dài.
* **Redirect 302**. Redirect 302 có nghĩa là URL được chuyển "tạm thời" sang URL dài, tức là các request tiếp theo đến cùng URL trước tiên sẽ được gửi đến dịch vụ rút gọn URL. Sau đó, chúng được chuyển hướng đến server của URL dài.

Mỗi phương pháp redirect đều có ưu điểm và nhược điểm. Nếu ưu tiên **giảm tải cho server**, dùng redirect 301 là hợp lý, vì chỉ request đầu tiên đến cùng một URL được gửi đến server rút gọn URL. Tuy nhiên, nếu analytics quan trọng, redirect 302 là lựa chọn tốt hơn, vì nó giúp **theo dõi click-through rate và nguồn của lượt click** dễ dàng hơn.

Cách trực quan nhất để triển khai chuyển hướng URL là **dùng hash table**. Giả sử hash table lưu các cặp \<shortURL, longURL>, chuyển hướng URL có thể được thực hiện như sau.

* Lấy longURL: `longURL = hashTable.get(shortURL)`
* Sau khi lấy được longURL, thực hiện chuyển hướng URL.

#### Rút gọn URL

Giả sử URL ngắn có dạng: `www.tinyurl.com/{hashValue}`. Để hỗ trợ use case rút gọn URL, chúng ta phải tìm một hàm băm fx ánh xạ URL dài thành hashValue, như trong Hình 8-3.

![](images/chapter8/figure8-3.jpg)

Hàm băm phải đáp ứng các yêu cầu sau.

* Mỗi longURL phải được băm thành một hashValue.
* Mỗi hashValue có thể được ánh xạ ngược về longURL.

Thiết kế chi tiết của hàm băm sẽ được thảo luận sâu hơn.

### Bước 3: Thiết kế chi tiết

Đến đây, chúng ta đã thảo luận về thiết kế cấp cao của việc rút gọn URL và chuyển hướng URL. Trong phần này, chúng ta sẽ đi sâu vào các nội dung sau: data model, hàm băm, rút gọn URL và chuyển hướng URL.

#### Data model

Trong thiết kế cấp cao, mọi thứ đều được lưu trong một hash table. Đây là điểm khởi đầu tốt; tuy nhiên, cách này không khả thi trong các hệ thống thực tế, vì tài nguyên bộ nhớ có giới hạn và đắt đỏ. Một lựa chọn tốt hơn là lưu mapping \<shortURL, longURL> trong một relational database. Hình 8-4 cho thấy thiết kế đơn giản của bảng database. Phiên bản đơn giản của bảng gồm 3 cột: id, shortURL, longURL.

![](images/chapter8/figure8-4.jpg)

#### Hàm băm

Hàm băm được dùng để băm một URL dài thành một URL ngắn, còn gọi là hashValue.

**Độ dài hashValue**

hashValue được tạo thành từ các ký tự trong \[0-9, a-z, A-Z], gồm $$10+26+26=62$$ ký tự có thể dùng. Để tính độ dài hashValue, hãy tìm n nhỏ nhất sao cho $$62^n \ge 36,5 tỷ$$. Theo ước tính, hệ thống phải hỗ trợ tối đa 365 tỷ URL. Bảng 8-1 cho thấy độ dài hashValue và số URL tối đa tương ứng mà nó có thể hỗ trợ.

![](images/chapter8/table8-1.jpg)

Khi $$n = 7$$, $$62 ^ n \approx 3.5 nghìn tỷ$$; 3.5 nghìn tỷ đủ để chứa 365 tỷ URL, vì vậy độ dài hashValue là 7.

Chúng ta sẽ tìm hiểu hai loại hàm băm cho URL shortener. Loại thứ nhất là "hash + xử lý collision", loại thứ hai là "chuyển đổi base 62". Hãy lần lượt xem xét từng loại.

**Hash + xử lý collision**

Để rút gọn URL dài, chúng ta nên triển khai một hàm băm biến URL dài thành chuỗi 7 ký tự. Một giải pháp trực tiếp là dùng các hàm băm phổ biến như CRC32, MD5 hoặc SHA-1. Bảng dưới đây so sánh kết quả băm khi áp dụng các hàm băm khác nhau lên URL này ([https://en.wikipedia.org/wiki/Systems\_design](https://en.wikipedia.org/wiki/Systems\_design)):

![](images/chapter8/table8-2.jpg)

Như Bảng 8-2 cho thấy, ngay cả hashValue ngắn nhất (từ CRC32) cũng quá dài (hơn 7 ký tự). Làm thế nào để rút ngắn nó hơn nữa?

Cách đầu tiên là lấy 7 ký tự đầu tiên của hashValue; tuy nhiên, cách này sẽ gây ra hash collision. Để xử lý hash collision, chúng ta có thể đệ quy nối thêm một chuỗi được định nghĩa trước cho đến khi không còn collision nào được phát hiện. Quy trình này được giải thích trong Hình 8-5.

![](images/chapter8/figure8-5.jpg)

Cách này có thể loại bỏ collision; tuy nhiên, việc query database để kiểm tra sự tồn tại của URL ngắn trong mỗi request sẽ tốn kém. Một kỹ thuật có tên **Bloom filter** \[2] có thể cải thiện hiệu năng. Bloom filter là một kỹ thuật xác suất tiết kiệm không gian, dùng để kiểm tra một phần tử có phải là thành viên của một tập hợp hay không. Xem tài liệu tham khảo \[2] để biết thêm chi tiết.

**Chuyển đổi base 62**

Chuyển đổi base là một phương pháp khác thường được dùng trong URL shortener. Chuyển đổi base giúp chuyển đổi cùng một số giữa các hệ biểu diễn số khác nhau. Ta dùng chuyển đổi base 62 vì hashValue có 62 ký tự có thể dùng. Hãy dùng một ví dụ để giải thích cách chuyển đổi hoạt động: chuyển $$11157_{10}$$ sang biểu diễn base 62 ( $$11157_{10}$$ biểu diễn 11157 trong hệ base 10).


* Đúng như tên gọi, base 62 là cách mã hóa sử dụng 62 ký tự. Mapping là: 0-0, ..., 9-9, 10-a, 11-b, ..., 35-z, 36-A, ..., 61-Z, trong đó “a” đại diện cho 10, “Z” đại diện cho 61, v.v.
* $$11157_{10} = 2 \times 62^2 + 55 \times 62^1 + 59 \times 62^0 = \left [2, 55, 59 \right ] \rightarrow \left [2, T, X \right]$$ ở dạng base 62.

    Quy trình chuyển đổi được thể hiện trong Hình 8-6.

    ![](images/chapter8/figure8-6.jpg)
* Vì vậy, URL ngắn là: https://tinyurl.com/2TX

**So sánh hai phương pháp**

Bảng dưới đây cho thấy sự khác nhau giữa hai phương pháp.

| Hash + xử lý collision                    | Chuyển đổi base 62                                    |
| -------------------------- | --------------------------------------------- |
| Độ dài URL ngắn cố định                   | Độ dài URL ngắn không cố định, thay đổi theo id                           |
| Không cần unique ID generator                 | Phương pháp này phụ thuộc vào unique ID generator                                 |
| Có thể xảy ra collision, phải xử lý                | Không thể xảy ra collision vì ID là duy nhất                            |
| Không thể tính URL ngắn tiếp theo có thể dùng, vì nó không phụ thuộc vào ID. | Nếu ID của entry mới tăng thêm 1, rất dễ tìm ra URL ngắn tiếp theo có thể dùng. Đây có thể là một vấn đề bảo mật. |

#### Tìm hiểu sâu về việc rút gọn URL

Là một trong những phần cốt lõi của hệ thống, chúng ta muốn quy trình rút gọn URL đơn giản và thực tế về mặt logic. Trong thiết kế này, chúng ta dùng chuyển đổi base 62. Chúng ta xây dựng sơ đồ sau (Hình 8-7) để minh họa quy trình.

![](images/chapter8/figure8-7.jpg)

1. longURL là input
2. Hệ thống kiểm tra longURL có tồn tại trong database hay không
3. Nếu có, điều đó nghĩa là longURL đã được chuyển đổi thành shortURL trước đó. Trong trường hợp này, lấy shortURL từ database và trả về cho client.
4. Nếu không, longURL là URL mới. Một ID duy nhất mới (primary key) được tạo bởi unique ID generator.
5. Dùng chuyển đổi base 62 để chuyển ID thành shortURL.
6. Tạo một record mới trong database với ID, shortURL và longURL.

Để quy trình dễ hiểu hơn, hãy xem một ví dụ cụ thể.

* Giả sử longURL đầu vào là: https://en.wikipedia.org/wiki/Systems\_design
* Unique ID generator trả về ID: 2009215674938
* Dùng chuyển đổi base 62 để chuyển ID thành shortURL. ID (2009215674938) được chuyển thành "zn9edcu".
*   Lưu ID, shortURL và longURL vào database, như trong Bảng 8-4.

    ![](images/chapter8/table8-4.jpg)

Đáng nhắc đến là distributed unique ID generator. Chức năng chính của nó là tạo global unique ID để tạo shortURL. Trong môi trường phân tán cao, việc triển khai unique ID generator là một thách thức. May mắn là chúng ta đã thảo luận một số giải pháp trong “Chương 7: Thiết kế unique ID generator trong distributed system”. Bạn có thể xem lại phần đó để ôn lại kiến thức.

#### Tìm hiểu sâu về chuyển hướng URL

Hình 8-8 cho thấy thiết kế chi tiết của chuyển hướng URL. Vì số lần đọc nhiều hơn số lần ghi, mapping `<shortURL, longURL>` được lưu trong cache để cải thiện hiệu năng.

![](images/chapter8/figure8-8.jpg)

Quy trình chuyển hướng URL được tóm tắt như sau:

* Một người dùng nhấp vào liên kết URL ngắn: `https://tinyurl.com/zn9edcu`
* Load balancer chuyển request đến web server
* Nếu shortURL đã có trong cache, trả về longURL ngay.
* Nếu URL ngắn không có trong cache, lấy URL dài từ database. Nếu nó không có trong database, rất có thể người dùng đã nhập một URL ngắn không hợp lệ.
* Trả longURL về cho người dùng.

### Bước 4: Tóm tắt

Trong chương này, chúng ta đã thảo luận về thiết kế API, data model, hàm băm, rút gọn URL và chuyển hướng URL.

Nếu còn thời gian sau khi kết thúc buổi phỏng vấn, dưới đây là một số điểm mở rộng để thảo luận:

* Rate limiter: Một vấn đề bảo mật tiềm ẩn mà chúng ta có thể gặp là người dùng độc hại gửi một lượng lớn request rút gọn URL. Rate limiter giúp lọc request dựa trên địa chỉ IP hoặc các quy tắc lọc khác. Nếu muốn ôn lại về rate limiting, hãy xem “Chương 4: Thiết kế rate limiter”.
* Mở rộng web server: Vì web layer là stateless, việc scale web layer bằng cách thêm hoặc xóa web server rất dễ dàng.
* Mở rộng database. Database replication và sharding là những kỹ thuật phổ biến.
* Analytics. Dữ liệu ngày càng quan trọng đối với thành công của doanh nghiệp. Tích hợp một giải pháp analytics vào URL shortener có thể giúp trả lời một số câu hỏi quan trọng, chẳng hạn có bao nhiêu người nhấp vào một liên kết? Họ nhấp vào liên kết khi nào? v.v.
* Availability, consistency và reliability. Những khái niệm này là nền tảng cho thành công của mọi hệ thống lớn. Chúng ta đã thảo luận chi tiết về chúng trong Chương 1, hãy ôn lại các chủ đề này.

Chúc mừng bạn đã đi đến đây! Hãy tự động viên mình một chút, bạn đã làm rất tốt!

### Tài liệu tham khảo

\[1] A RESTful Tutorial: <https://www.restapitutorial.com/index.html>

\[2] Bloom filter: <https://en.wikipedia.org/wiki/Bloom_filter>
