# Chương 04: Thiết kế một rate limiter


Trong các hệ thống mạng, rate limiter được dùng để kiểm soát tốc độ gửi traffic của client hoặc server. Trong thế giới HTTP, rate limiter giới hạn số request mà client được phép gửi trong một khoảng thời gian nhất định. Nếu số request API vượt quá ngưỡng do rate limiter đặt ra, tất cả các request vượt ngưỡng sẽ bị chặn. Dưới đây là một số ví dụ:

* Một người dùng được phép đăng tối đa 2 bài viết mỗi giây
* Mỗi địa chỉ IP được phép tạo tối đa 10 tài khoản mỗi ngày.
* Mỗi thiết bị được phép nhận phần thưởng tối đa 5 lần mỗi tuần.

Trong chương này, bạn cần thiết kế một rate limiter. Trước khi bắt đầu thiết kế, hãy cùng xem những lợi ích của việc sử dụng API rate limiter:

* Ngăn tài nguyên cạn kiệt do các cuộc tấn công từ chối dịch vụ (DoS) \[1]. Hầu như mọi API do các công ty công nghệ lớn phát hành đều áp dụng một hình thức rate limit nào đó. Ví dụ, Twitter giới hạn số tweet ở mức 300 tweet mỗi 3 giờ \[2]. Google docs APIs có các giới hạn mặc định như sau: mỗi user được thực hiện 300 read request trong mỗi 60 giây \[3]. Rate limiter ngăn các cuộc tấn công DoS, dù cố ý hay vô tình, bằng cách chặn các request vượt mức.
* Giảm chi phí. Giới hạn số request vượt mức đồng nghĩa với việc giảm số lượng server và phân bổ thêm tài nguyên cho các API có độ ưu tiên cao. Rate limit đặc biệt quan trọng đối với các công ty sử dụng API bên thứ ba có tính phí. Ví dụ, các API bên ngoài sau đây tính phí theo số lần gọi: kiểm tra tín dụng, thanh toán, truy xuất hồ sơ sức khỏe, v.v. Giới hạn số lần gọi là yếu tố thiết yếu để giảm chi phí.
* Ngăn server quá tải. Để giảm tải cho server, hãy dùng rate limiter để lọc các request quá mức do bot hoặc hành vi không phù hợp của người dùng tạo ra.

### Bước 1: Tìm hiểu vấn đề và xác định phạm vi thiết kế

Rate limit có thể được triển khai bằng nhiều thuật toán khác nhau, mỗi thuật toán đều có ưu điểm và nhược điểm. Trao đổi giữa interviewer và candidate giúp làm rõ loại rate limiter mà chúng ta cần xây dựng.

Candidate: Chúng ta cần thiết kế loại rate limiter nào? Rate limiter phía client hay API rate limiter phía server?

Interviewer: Câu hỏi hay. Chúng ta sẽ tập trung vào API rate limiter phía server.

Candidate: Rate limiter sẽ giới hạn request API dựa trên IP, user ID hay thuộc tính nào khác?

Interviewer: Rate limiter phải đủ linh hoạt để hỗ trợ nhiều bộ quy tắc rate limit khác nhau.

Candidate: Quy mô của hệ thống là bao nhiêu? Hệ thống được xây dựng cho một startup hay một công ty lớn có lượng người dùng rất lớn?

Interviewer: Hệ thống phải xử lý được số lượng request lớn.

Candidate: Hệ thống có hoạt động trong môi trường phân tán không?

Interviewer: Có.

Candidate: Rate limiter là một service độc lập hay nên được triển khai trong application code?

Interviewer: Đây là một vấn đề thiết kế do bạn quyết định.

Candidate: Có cần thông báo cho người dùng bị rate limit không?

Interviewer: Có.

**Yêu cầu**

Dưới đây là phần tóm tắt các yêu cầu của hệ thống:

* Giới hạn chính xác các request vượt mức
* Độ trễ thấp: rate limiter không được làm tăng thời gian response HTTP.
* Sử dụng càng ít memory càng tốt.
* Rate limit phân tán, có thể được chia sẻ giữa nhiều server hoặc process.
* Xử lý exception: khi request của người dùng bị giới hạn, hiển thị thông báo lỗi rõ ràng cho người dùng.
* Khả năng chịu lỗi cao. Nếu rate limiter gặp bất kỳ vấn đề nào (ví dụ, một cache server bị offline), vấn đề đó không được ảnh hưởng đến toàn bộ hệ thống.

### Bước 2: Đề xuất thiết kế cấp cao và đạt được sự đồng thuận

Hãy giữ mọi thứ đơn giản và dùng mô hình client-server cơ bản để giao tiếp.

#### Đặt rate limiter ở đâu

Theo trực giác, bạn có thể triển khai rate limiter ở phía client hoặc phía server.

* Triển khai phía client. Nhìn chung, client là nơi không đáng tin cậy để thực hiện rate limit, vì request từ client rất dễ bị người dùng độc hại giả mạo. Ngoài ra, chúng ta có thể không kiểm soát được việc triển khai client.
*   Triển khai phía server. Hình 4-1 minh họa một rate limiter được đặt ở phía server.

    ![](../images/chapter4/figure4-1.jpg)

Ngoài cách triển khai phía client và phía server, còn một phương án khác. Thay vì đặt rate limiter trên API server, chúng ta có thể tạo một middleware rate limiter để giới hạn request gửi đến API, như trong Hình 4-2:

![](../images/chapter4/figure4-2.jpg)

Hãy dùng ví dụ trong Hình 4-3 để minh họa cách rate limiter hoạt động trong thiết kế này. Giả sử API cho phép 2 request mỗi giây, nhưng client gửi 3 request đến server trong một giây. Hai request đầu được route đến API server. Tuy nhiên, middleware rate limiter sẽ giới hạn request thứ ba và trả về HTTP status code 429. HTTP response status code 429 cho biết user đã gửi quá nhiều request.

![](../images/chapter4/figure4-3.jpg)

Cloud microservice \[4] đã trở nên rất phổ biến, và rate limit thường được triển khai trong một component gọi là API gateway. API gateway là một service được quản lý hoàn toàn, hỗ trợ rate limit, SSL, authentication, IP whitelist, phục vụ static content, v.v. Hiện tại, chúng ta chỉ cần biết API gateway là một middleware hỗ trợ rate limit.

Khi thiết kế rate limiter, một câu hỏi quan trọng cần tự hỏi là: nên triển khai rate limiter ở đâu, phía server hay trong gateway? Không có câu trả lời tuyệt đối. Điều này phụ thuộc vào tech stack hiện tại, nguồn lực engineering, mức độ ưu tiên, mục tiêu của công ty, v.v. Dưới đây là một số hướng dẫn chung:

* Đánh giá tech stack hiện tại, chẳng hạn như ngôn ngữ lập trình và cache service. Đảm bảo ngôn ngữ lập trình hiện tại có thể triển khai rate limit hiệu quả ở phía server.
* Xác định thuật toán rate limit phù hợp với yêu cầu nghiệp vụ. Khi tự triển khai mọi thứ ở phía server, bạn có toàn quyền kiểm soát thuật toán. Tuy nhiên, nếu sử dụng gateway bên thứ ba, các lựa chọn của bạn có thể bị giới hạn.
* Nếu bạn đã sử dụng microservice architecture và thiết kế đã có API gateway để thực hiện authentication, IP whitelist, v.v., bạn có thể thêm rate limiter vào API gateway.
* Xây dựng rate limit service của riêng bạn cần thời gian. Nếu không có đủ nguồn lực engineering để triển khai rate limiter, một API gateway thương mại sẽ là lựa chọn tốt hơn.

#### Các thuật toán rate limit

Rate limit có thể được triển khai bằng nhiều thuật toán khác nhau, mỗi thuật toán đều có những ưu điểm và nhược điểm riêng. Mặc dù chương này không tập trung vào thuật toán, việc hiểu chúng ở cấp cao sẽ giúp chúng ta chọn đúng thuật toán hoặc tổ hợp thuật toán phù hợp với trường hợp sử dụng.

Dưới đây là danh sách các thuật toán phổ biến:

* Token bucket
* Leaking bucket
* Fixed window counter
* Sliding window log
* Sliding window counter

**Thuật toán token bucket**

Thuật toán token bucket được sử dụng rộng rãi cho rate limit. Thuật toán này đơn giản, dễ hiểu và thường được các công ty Internet sử dụng. Amazon \[5] và Stripe \[6] đều dùng thuật toán này để giới hạn API request.

**Thuật toán token bucket hoạt động như sau:**

* Token bucket là một container có capacity được định trước. Token được đưa vào bucket định kỳ theo một rate định trước; khi bucket đầy thì không thêm token nữa. Như minh họa trong Hình 4-4, token bucket có capacity là 4, bộ nạp đưa 2 token vào bucket mỗi giây; khi bucket đầy, các token dư sẽ bị tràn.

    ![](../images/chapter4/figure4-4.jpg)

*   Mỗi request tiêu thụ một token. Khi một request đến, chúng ta kiểm tra xem bucket có đủ token hay không. Hình 4-5 giải thích cách hoạt động này.

    * Nếu có đủ token, chúng ta lấy ra một token cho mỗi request, sau đó request được đi qua.
    * Nếu không có đủ token, request sẽ bị loại bỏ.

    ![](../images/chapter4/figure4-5.jpg)

Hình 4-6 minh họa cách hoạt động của việc tiêu thụ token, nạp lại token và logic rate limit. Trong ví dụ này, kích thước token bucket là 4, tốc độ nạp lại là 4 token mỗi 1 phút.

![](../images/chapter4/figure4-6.jpg)

Thuật toán token bucket cần hai tham số:

1. Kích thước bucket: số token tối đa được phép có trong bucket.
2. Tốc độ nạp: số token được đưa vào bucket mỗi giây.

Chúng ta cần bao nhiêu bucket? Điều này phụ thuộc vào các quy tắc rate limit và sẽ khác nhau tùy trường hợp. Dưới đây là một vài ví dụ.

* Thông thường, cần dùng các bucket khác nhau cho các API endpoint khác nhau. Ví dụ, nếu một người dùng được phép đăng 1 bài viết mỗi giây, thêm 150 bạn mỗi ngày và like 5 bài viết mỗi giây, mỗi người dùng cần 3 bucket.
* Nếu cần giới hạn request theo địa chỉ IP, mỗi địa chỉ IP cần một bucket.
* Nếu hệ thống cho phép tối đa 10,000 request mỗi giây, một global bucket dùng chung cho tất cả request sẽ là lựa chọn hợp lý.

**Ưu điểm**

* Thuật toán dễ triển khai
* Tốn ít memory
* Token bucket cho phép traffic burst trong thời gian ngắn. Chừng nào vẫn còn token, request vẫn có thể đi qua.

**Nhược điểm**

* Thuật toán có hai tham số là kích thước bucket và tốc độ bổ sung token. Tuy nhiên, việc điều chỉnh chúng cho đúng có thể là một thách thức.

**Thuật toán leaking bucket**

Thuật toán leaking bucket tương tự token bucket, khác biệt là request được xử lý ở một rate cố định. Thuật toán này thường được triển khai bằng queue FIFO (first-in-first-out).

Thuật toán hoạt động như sau:

* Khi request đến, hệ thống kiểm tra xem queue đã đầy chưa. Nếu queue chưa đầy, request được thêm vào queue.
* Nếu queue đã đầy, request sẽ bị loại bỏ.
* Request được lấy ra khỏi queue và xử lý theo các khoảng thời gian cố định.

Hình 4-7 giải thích cách thuật toán hoạt động:

![](../images/chapter4/figure4-7.jpg)

Thuật toán leaking bucket cần hai tham số sau:

* Kích thước bucket: bằng kích thước queue. Queue chứa các request sẽ được xử lý ở một tốc độ cố định.
* Tốc độ chảy ra: xác định số request có thể được xử lý ở rate cố định, thường tính theo giây.

Shopify, một công ty thương mại điện tử, sử dụng leaking bucket để giới hạn rate \[7].

**Ưu điểm:**

* Hiệu quả về memory vì kích thước queue là hữu hạn.
* Request được xử lý ở một rate cố định, nên thuật toán phù hợp với các use case cần tốc độ chảy ra ổn định.

**Nhược điểm:**

* Traffic burst có thể làm queue đầy các request cũ. Nếu những request này không được xử lý kịp thời, các request mới sẽ bị rate limit.
* Thuật toán có hai tham số, và việc điều chỉnh chúng cho phù hợp có thể không dễ dàng.

**Thuật toán fixed window counter**

Thuật toán fixed window counter hoạt động như sau:

* Thuật toán chia timeline thành các time window có kích thước cố định và gán một counter cho mỗi window.
* Mỗi request làm counter tăng thêm một.
* Khi counter đạt ngưỡng định trước, các request mới sẽ bị loại bỏ cho đến khi time window mới bắt đầu.

Hãy dùng một ví dụ cụ thể để xem thuật toán hoạt động như thế nào. Trong Hình 4-8, đơn vị thời gian là 1 giây và hệ thống cho phép tối đa 3 request mỗi giây. Trong mỗi time window một giây, nếu nhận được hơn 3 request thì các request dư sẽ bị loại bỏ, như minh họa trong Hình 4-8:
![](../images/chapter4/figure4-8.jpg)

Một vấn đề lớn của thuật toán này là traffic burst ở ranh giới của time window có thể khiến số request vượt quá quota cho phép. Hãy xem xét tình huống sau:

![](../images/chapter4/figure4-9.jpg)

Trong Hình 4-9, hệ thống cho phép tối đa 5 request mỗi phút và quota khả dụng được reset vào đầu mỗi phút. Như hình minh họa, có 5 request trong khoảng từ 2:00:00 đến 2:01:00, rồi thêm 5 request trong khoảng từ 2:01:00 đến 2:02:00. Trong time window một phút từ 2:00:30 đến 2:01:30, có 10 request được đi qua. Con số này gấp đôi số request được phép.

**Ưu điểm:**

* Tiết kiệm memory
* Dễ hiểu
* Quota khả dụng được reset khi time window kết thúc, phù hợp với một số use case

**Nhược điểm:**

* Traffic tăng đột biến ở ranh giới window có thể khiến các request vượt quá quota cho phép vẫn được đi qua (tạo spike)

**Thuật toán sliding window log**

Như đã đề cập, thuật toán fixed window counter có một vấn đề lớn: nó cho phép nhiều request hơn đi qua ở ranh giới của window. Thuật toán sliding window log giải quyết vấn đề này. Nó hoạt động như sau:

* Thuật toán theo dõi timestamp của request. Dữ liệu timestamp thường được lưu trong cache, chẳng hạn như Redis sorted \[8].
* Khi một request mới đến, xóa mọi timestamp đã hết hạn. Timestamp cũ được định nghĩa là timestamp sớm hơn thời điểm bắt đầu của time window hiện tại.
* Thêm timestamp của request mới vào log.
* Nếu kích thước log nhỏ hơn hoặc bằng số request cho phép thì chấp nhận request. Nếu không, request sẽ bị từ chối.

Hãy dùng ví dụ trong Hình 4-10 để giải thích thuật toán.

![](../images/chapter4/figure4-10.jpg)

Trong ví dụ này, rate limiter cho phép 2 request mỗi phút. Thông thường, timestamp của Linux sẽ được lưu trong log. Tuy nhiên, để dễ đọc hơn, ví dụ này sử dụng cách biểu diễn thời gian mà con người có thể đọc được.

* Khi một request mới đến vào lúc $$1:00:01$$, log đang rỗng. Vì vậy request được cho phép.
* Một request mới đến vào lúc $$1:00:30$$, timestamp $$1:00:30$$ được chèn vào log. Sau khi chèn, kích thước log là 2, không lớn hơn số lượng cho phép, nên request được cho phép.
* Một request mới đến vào lúc $$1:00:50$$, timestamp được chèn vào log. Sau khi chèn, kích thước log là 3, lớn hơn kích thước cho phép là 2. Vì vậy request bị từ chối, dù timestamp vẫn nằm trong log.
* Một request mới đến vào lúc $$1:01:40$$. Các request trong khoảng $$\left [1:00:40,1:01:40 \right]$$ nằm trong time window mới nhất, còn các request được gửi trước $$1:00:40$$ đã hết hạn.
* Hai timestamp hết hạn $$1:00:01$$ và $$1:00:30$$ được xóa khỏi log. Sau thao tác xóa, kích thước log trở thành 2; vì vậy request được chấp nhận.

**Ưu điểm:**

* Rate limit được triển khai bằng thuật toán này **rất chính xác**. Trong bất kỳ rolling window nào, số request sẽ không vượt quá rate limit.

**Nhược điểm:**

* Thuật toán này tiêu tốn nhiều memory, vì timestamp của một request vẫn có thể được lưu trong memory ngay cả khi request đó bị từ chối.

**Thuật toán sliding window counter**

Thuật toán sliding window counter là một phương pháp kết hợp fixed window counter và sliding window log. Thuật toán này có thể được triển khai theo hai cách khác nhau. Trong phần này, chúng ta sẽ giải thích một cách triển khai và cung cấp tham khảo về cách triển khai còn lại ở cuối phần.

Hình 4-11 minh họa cách thuật toán hoạt động:

![](../images/chapter4/figure4-11.jpg)

Giả sử rate limiter cho phép tối đa 7 request mỗi phút, phút trước có 5 request và phút hiện tại có 3 request. Với một request mới đến tại vị trí 30% trong phút hiện tại, số request trong rolling window được tính bằng công thức sau:

* Số request trong window hiện tại + số request trong window trước đó * phần trăm overlap giữa rolling window và window trước đó
* Áp dụng công thức này, ta có $$3 + 5 \times 70 \% = 6.5$$ request. Tùy use case, con số này có thể được làm tròn lên hoặc xuống. Trong ví dụ này, nó được làm tròn xuống thành 6.

Vì rate limiter cho phép tối đa 7 request mỗi phút, request hiện tại có thể đi qua. Tuy nhiên, sau khi nhận thêm một request nữa, giới hạn sẽ đạt đến mức tối đa.

Do giới hạn về dung lượng, chúng ta không thảo luận về các cách triển khai khác ở đây. Độc giả quan tâm có thể tham khảo tài liệu tham khảo \[9]. Thuật toán này không hoàn hảo. Nó có cả ưu điểm và nhược điểm.

**Ưu điểm:**

* Nó làm phẳng các peak của traffic vì rate được tính dựa trên rate trung bình của window trước đó.
* Tiết kiệm memory

**Nhược điểm:**

* Nó chỉ phù hợp với rolling window không quá nghiêm ngặt. Đây là giá trị xấp xỉ của rate thực tế vì nó giả định request trong window trước đó được phân bố đồng đều. Tuy nhiên, vấn đề này có thể không nghiêm trọng như ta tưởng. Theo thử nghiệm do Cloudflare \[10] thực hiện, trong 400 triệu request chỉ có 0.003% request bị cho phép hoặc bị rate limit sai.

#### Kiến trúc cấp cao

Ý tưởng cơ bản của rate limit rất đơn giản. Ở cấp cao, chúng ta cần một counter để theo dõi số request đến từ cùng một user, địa chỉ IP, v.v. Nếu counter lớn hơn giá trị giới hạn, request sẽ bị chặn.

Chúng ta nên lưu counter ở đâu? Vì truy cập disk chậm, dùng database không phải là ý tưởng hay. Memory cache được lựa chọn vì tốc độ nhanh và hỗ trợ chính sách hết hạn dựa trên thời gian. Ví dụ, Redis \[11] là một lựa chọn phổ biến để triển khai rate limit. Redis là một hệ thống lưu trữ trong memory, cung cấp hai command: `INCR` và `EXPIRE`

* `INCR`: tăng counter được lưu trữ lên 1.
* `EXPIRE`: đặt timeout cho counter. Sau khi timeout kết thúc, counter sẽ tự động bị xóa.

Hình 4-12 thể hiện kiến trúc cấp cao của rate limit, với cách hoạt động như sau:

![](../images/chapter4/figure4-12.jpg)

* Client gửi request đến middleware rate limiter.
* Middleware rate limiter lấy counter từ bucket tương ứng trong Redis và kiểm tra xem đã đạt giới hạn chưa.
  * Nếu đã đạt giới hạn, request bị từ chối.
  * Nếu chưa đạt giới hạn, request được gửi đến API server. Đồng thời, hệ thống tăng counter và lưu lại vào Redis.

### Bước 3: Thiết kế chi tiết

Thiết kế cấp cao trong Hình 4-12 chưa trả lời các câu hỏi sau:

* Tạo các rule rate limit như thế nào? Các rule này được lưu ở đâu?
* Xử lý các request bị giới hạn như thế nào?

Trong phần này, trước tiên chúng ta sẽ trả lời câu hỏi về rule rate limit, sau đó giới thiệu các chiến lược xử lý request bị rate limit. Cuối cùng, chúng ta sẽ thảo luận về rate limit trong môi trường phân tán, thiết kế chi tiết, tối ưu hiệu năng và monitoring.

#### Các rule rate limit

`Lyft` đã open source component rate limit của họ \[12]. Chúng ta sẽ xem qua nội bộ của component này và xem một số ví dụ về rule rate limit.

```yaml
domain: messaging
descriptors:
  - key: message_type
    Value: marketing
    rate_limit:
      unit: day
      requests_per_unit: 5
```

Trong ví dụ trên, hệ thống được cấu hình để cho phép tối đa 5 tin nhắn marketing mỗi ngày. Dưới đây là một ví dụ khác:

```yaml
domain: auth
descriptors:
  - key: auth_type
    Value: login
    rate_limit:
      unit: minute
      requests_per_unit: 5
```

Rule này cho biết client không được đăng nhập quá 5 lần trong 1 phút. Rule thường được viết trong configuration file và lưu trên disk.

#### Vượt quá rate limit

Nếu một request bị rate limit, API sẽ trả về cho client HTTP response code 429 (quá nhiều request). Tùy use case, chúng ta có thể đưa các request bị rate limit vào queue để xử lý sau. Ví dụ, nếu một số order bị rate limit vì hệ thống quá tải, chúng ta có thể giữ các order đó để xử lý sau.

#### Request header của rate limiter

Client làm thế nào biết mình có bị throttle hay không? Client làm thế nào biết còn được phép gửi bao nhiêu request trước khi bị throttle? Câu trả lời nằm trong HTTP response header. Rate limiter trả về cho client các HTTP header sau:

* X-Ratelimit-Remaining: số request còn lại được phép trong window.
* X-Ratelimit-limit: cho biết client có thể thực hiện bao nhiêu call trong mỗi time window.
* X-Ratelimit-Retry-After: số giây cần chờ trước khi có thể gửi request lần nữa mà không bị throttle.

Khi người dùng gửi quá nhiều request, client sẽ nhận được lỗi 429 too many requests cùng với header X-Ratelimit-Retry-After.

#### Thiết kế chi tiết

Hình 4-13 trình bày thiết kế chi tiết của hệ thống.

![](../images/chapter4/figure4-13.jpg)

* Rule được lưu trên disk. Worker thường xuyên lấy rule từ disk và lưu chúng vào cache.
* Khi client gửi request đến server, request trước tiên được gửi đến middleware rate limiter.
* Middleware rate limiter load rule từ cache. Nó lấy counter và timestamp của request gần nhất từ Redis cache. Dựa trên response, rate limiter quyết định:
  * Nếu request không bị rate limit, request được forward đến API server.
  * Nếu request bị rate limit, rate limiter trả về cho client lỗi 429 too many requests. Đồng thời, request bị loại bỏ hoặc được forward vào queue.

#### Rate limiter trong môi trường phân tán

Xây dựng một rate limiter chạy trong môi trường một server không khó. Tuy nhiên, mở rộng hệ thống để hỗ trợ nhiều server và các thread chạy đồng thời lại là chuyện khác. Có hai thách thức:

* Race condition
* Vấn đề đồng bộ

**Race condition**

Như đã đề cập, rate limiter hoạt động ở cấp cao như sau:


- Đọc giá trị counter từ Redis
- Kiểm tra xem ( counter + 1 ) có vượt ngưỡng không
- Nếu không, tăng giá trị counter trong Redis lên 1


Như minh họa trong Hình 4-14, race condition xảy ra trong môi trường có mức độ đồng thời cao.

![](../images/chapter4/figure4-14.jpg)

Giả sử giá trị counter trong Redis là 3. Nếu hai request cùng đọc giá trị counter trước khi một trong hai request ghi giá trị trở lại, mỗi request sẽ tăng counter lên 1 và ghi giá trị trở lại mà không kiểm tra thread còn lại. Cả hai request (thread) đều cho rằng giá trị counter đúng của chúng là 4. Tuy nhiên, giá trị counter đúng phải là 5.

Lock là giải pháp rõ ràng nhất cho race condition. Tuy nhiên, lock làm hệ thống chậm đi đáng kể. Thông thường, hai chiến lược được dùng để giải quyết vấn đề này là Lua script [[13](#ref13)] và cấu trúc dữ liệu sorted sets trong Redis [[8](#ref8)]. Độc giả quan tâm đến các chiến lược này có thể tham khảo các tài liệu tương ứng [[8](#ref8)] [[13](#ref13)].

**Vấn đề đồng bộ**

Đồng bộ là một yếu tố quan trọng khác cần cân nhắc trong môi trường phân tán. Để hỗ trợ hàng triệu user, một rate limiter server có thể không đủ để xử lý traffic. Khi sử dụng nhiều rate limiter server, cần có cơ chế đồng bộ. Ví dụ, ở bên trái Hình 4-15, client 1 gửi request đến rate limiter 1, còn client 2 gửi request đến rate limiter 2. Vì web layer là stateless, client có thể gửi request đến các rate limiter khác nhau, như minh họa ở bên phải Hình 4-15. Nếu không đồng bộ, rate limiter 1 không có dữ liệu nào về client 2. Vì vậy, rate limiter không thể hoạt động đúng.
![](../images/chapter4/figure4-15.jpg)

Một giải pháp có thể là sử dụng sticky session, cho phép client gửi traffic đến cùng một rate limiter. Giải pháp này không được khuyến khích vì không scale được và thiếu linh hoạt. Cách tốt hơn là sử dụng một centralized data store như Redis.

Thiết kế được minh họa trong Hình 4-16:

![](../images/chapter4/figure4-16.jpg)

#### Tối ưu hiệu năng

Tối ưu hiệu năng là một chủ đề phổ biến trong các buổi phỏng vấn system design. Chúng ta sẽ đề cập đến hai cải tiến.

Trước tiên, thiết lập multi-data-center rất quan trọng đối với rate limiter vì user ở xa data center sẽ phải chịu độ trễ cao. Hầu hết cloud provider đều xây dựng nhiều edge server location trên khắp thế giới. Ví dụ, tính đến ngày 20 tháng 5 năm 2020, Cloudflare có 194 edge server được phân bố theo địa lý \[14]. Traffic được tự động route đến edge server gần nhất để giảm latency.

![](../images/chapter4/figure4-17.jpg)

Thứ hai, sử dụng mô hình eventual consistency để đồng bộ dữ liệu. Nếu bạn chưa rõ mô hình eventual consistency, hãy tham khảo phần "Consistency" trong "Chương 6: Thiết kế một key-value store".

#### Monitoring

Sau khi triển khai rate limiter, điều quan trọng nhất là thu thập dữ liệu phân tích để kiểm tra rate limiter có hoạt động hiệu quả hay không.

Trước tiên, chúng ta cần đảm bảo:

* Thuật toán rate limit có hiệu quả
* Rule rate limit có hiệu quả

Ví dụ, nếu rule rate limit quá nghiêm ngặt, nhiều request hợp lệ sẽ bị loại bỏ. Trong trường hợp này, chúng ta muốn nới lỏng rule một chút. Ở một ví dụ khác, chúng ta nhận thấy rate limiter trở nên kém hiệu quả khi traffic tăng đột ngột (chẳng hạn trong đợt flash sale). Trong tình huống này, chúng ta có thể thay thuật toán để hỗ trợ traffic burst. Token bucket rất phù hợp với tình huống này.

### Bước 4: Tóm tắt

Trong chương này, chúng ta đã thảo luận về các thuật toán rate limit khác nhau cùng ưu điểm và nhược điểm của chúng.

Các thuật toán được thảo luận gồm:

* Token bucket
* Leaking bucket
* Fixed window counter
* Sliding window log
* Sliding window counter

Sau đó, chúng ta đã thảo luận về kiến trúc hệ thống, rate limiter trong môi trường phân tán, tối ưu hiệu năng và monitoring. Tương tự mọi câu hỏi system design trong phỏng vấn, nếu còn thời gian, bạn có thể đề cập đến các chủ đề khác:

* So sánh rate limit bằng hardware và software
  * Hardware: số lượng request không thể vượt quá ngưỡng
  * Software: số lượng request có thể vượt ngưỡng trong thời gian ngắn
* Rate limit ở các layer khác nhau. Trong chương này, chúng ta chỉ thảo luận rate limit ở application layer (HTTP: Layer 7); rate limit cũng có thể được áp dụng ở các layer khác. Ví dụ, bạn có thể dùng Iptables \[15] (IP: Layer 3) để áp dụng rate limit theo địa chỉ IP. Lưu ý: mô hình Open Systems Interconnection (OSI model) có 7 layer \[16]. Layer 1: physical layer, Layer 2: data link layer, Layer 3: network layer, Layer 4: transport layer, Layer 5: session layer, Layer 6: presentation layer, Layer 7: application layer.
* Tránh bị rate limit bằng cách thiết kế client theo best practice:
  * Dùng client cache để tránh gọi API thường xuyên
  * Hiểu các giới hạn và không gửi quá nhiều request trong thời gian ngắn
  * Bao gồm code để bắt exception hoặc error, giúp client khôi phục bình thường sau exception
  * Thêm đủ thời gian backoff cho retry logic

Chúc mừng bạn đã đi đến đây! Hãy tự động viên mình một chút, bạn đã làm rất tốt!

### Tài liệu tham khảo

\[1] Rate-limiting strategies and techniques: [https://cloud.google.com/solutions/rate-limiting-strategies-techniques](https://cloud.google.com/solutions/rate-limiting-strategies-techniques)

\[2] Twitter rate limits: [https://developer.twitter.com/en/docs/basics/rate-limits](https://developer.twitter.com/en/docs/basics/rate-limits)

\[3] Google docs usage limits: [https://developers.google.com/docs/api/limits](https://developers.google.com/docs/api/limits)

\[4] IBM microservices: [https://www.ibm.com/cloud/learn/microservices](https://www.ibm.com/cloud/learn/microservices)

\[5] Throttle API requests for better throughput:

[https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html)

\[6] Stripe rate limiters: [https://stripe.com/blog/rate-limiters](https://stripe.com/blog/rate-limiters)

\[7] Shopify REST Admin API rate limits: [https://help.shopify.com/en/api/reference/rest-admin-api-rate-limits](https://help.shopify.com/en/api/reference/rest-admin-api-rate-limits)

<a id="ref8"></a>
\[8] Better Rate Limiting With Redis Sorted Sets: [https://engineering.classdojo.com/blog/2015/02/06/rolling-rate-limiter/](https://engineering.classdojo.com/blog/2015/02/06/rolling-rate-limiter/)

\[9] System Design — Rate limiter and Data modelling: [https://medium.com/@saisandeepmopuri/system-design-rate-limiter-and-data-modelling-9304b0d18250](https://medium.com/@saisandeepmopuri/system-design-rate-limiter-and-data-modelling-9304b0d18250)

\[10] How we built rate limiting capable of scaling to millions of domains: [https://blog.cloudflare.com/counting-things-a-lot-of-different-things/](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)

\[11] Redis website: [https://redis.io/](https://redis.io/)

\[12] Lyft rate limiting: [https://github.com/lyft/ratelimit](https://github.com/lyft/ratelimit)

<a id="ref13"></a>
\[13] Scaling your API with rate limiters: [https://gist.github.com/ptarjan/e38f45f2dfe601419ca3af937fff574d#request-rate-limiter](https://gist.github.com/ptarjan/e38f45f2dfe601419ca3af937fff574d#request-rate-limiter)

\[14] What is edge computing: [https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/)

\[15] Rate Limit Requests with Iptables: [https://blog.programster.org/rate-limit-requests-with-iptables](https://blog.programster.org/rate-limit-requests-with-iptables)

\[16] OSI model: [https://en.wikipedia.org/wiki/OSI\_model#Layer\_architecture](https://en.wikipedia.org/wiki/OSI\_model#Layer\_architecture)
