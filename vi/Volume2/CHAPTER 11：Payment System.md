# Chương 11 Hệ thống thanh toán

Trong chương này, chúng ta sẽ thiết kế một hệ thống thanh toán. Những năm gần đây, thương mại điện tử đã tăng trưởng bùng nổ trên toàn cầu. Nền tảng cốt lõi để hỗ trợ mọi giao dịch diễn ra thuận lợi là một hệ thống thanh toán đáng tin cậy, có khả năng mở rộng và linh hoạt.

Theo định nghĩa của Wikipedia: “Hệ thống thanh toán là bất kỳ hệ thống nào thực hiện việc quyết toán giao dịch tài chính thông qua chuyển giao giá trị tiền tệ. Hệ thống này bao gồm các tổ chức, công cụ, con người, quy tắc, quy trình, tiêu chuẩn và công nghệ cần thiết để thực hiện giao dịch”[1].

Thoạt nhìn, hệ thống thanh toán khá dễ hiểu, nhưng lại là một thử thách lớn đối với nhiều developer, vì chỉ một lỗi nhỏ cũng có thể dẫn đến tổn thất khổng lồ và làm tổn hại uy tín. Tuy nhiên, đừng lo! Chương này sẽ từng bước vén màn những điều phức tạp của hệ thống thanh toán.


## Bước 1 - Hiểu bài toán và xác định phạm vi thiết kế

Hệ thống thanh toán có thể mang những ý nghĩa khác nhau với từng người. Một số người cho rằng đó là các ví điện tử như Apple Pay hoặc Google Pay; trong khi những người khác lại cho rằng đó là backend xử lý thanh toán như PayPal hoặc Stripe. Vì vậy, trước khi thiết kế, chúng ta phải làm rõ các yêu cầu. Sau đây là một đoạn hội thoại điển hình giữa ứng viên và interviewer:

Candidate: Chúng ta sẽ xây dựng loại hệ thống thanh toán nào?

Interviewer: Hãy giả sử bạn đang thiết kế backend thanh toán cho một ứng dụng thương mại điện tử tương tự Amazon.com. Sau khi khách hàng đặt hàng, hệ thống thanh toán sẽ xử lý mọi phần liên quan đến dòng tiền.

Candidate: Hệ thống hỗ trợ những phương thức thanh toán nào? Thẻ tín dụng, PayPal, thẻ ngân hàng, v.v.?

Interviewer: Hệ thống thực tế sẽ hỗ trợ tất cả các phương thức này. Nhưng trong thiết kế lần này, chúng ta lấy thanh toán bằng thẻ tín dụng làm ví dụ.

Candidate: Chúng ta có tự xử lý thanh toán bằng thẻ tín dụng không?

Interviewer: Không, chúng ta sử dụng payment processor bên thứ ba như Stripe, Braintree hoặc Square.

Candidate: Chúng ta có lưu thông tin thẻ tín dụng trong hệ thống không?

Interviewer: Không lưu. Vì liên quan đến các yêu cầu bảo mật và tuân thủ cực kỳ nghiêm ngặt, hệ thống không trực tiếp lưu số thẻ; tổ chức thanh toán bên thứ ba sẽ chịu trách nhiệm việc này.

Candidate: Ứng dụng có hoạt động trên toàn cầu không? Có cần hỗ trợ nhiều loại tiền tệ và thanh toán quốc tế không?

Interviewer: Có, hãy giả sử ứng dụng hướng đến người dùng toàn cầu, nhưng trong buổi phỏng vấn này chúng ta chỉ giả định sử dụng một loại tiền tệ.

Candidate: Hệ thống xử lý bao nhiêu giao dịch mỗi ngày?

Interviewer: Khoảng 1 triệu giao dịch mỗi ngày.

Candidate: Có cần hỗ trợ quy trình chuyển tiền cho seller (pay-out flow) không?

Interviewer: Có, cần hỗ trợ.

Candidate: Tôi nghĩ mình đã thu thập đủ tất cả yêu cầu. Còn điều gì tôi cần lưu ý không?

Interviewer: Có. Một hệ thống thanh toán sẽ tương tác với nhiều service nội bộ (chẳng hạn accounting, analytics, v.v.) và service bên ngoài (chẳng hạn payment service provider). Khi một service gặp sự cố, chúng ta có thể thấy trạng thái không nhất quán giữa các service khác nhau. Vì vậy, chúng ta cần thực hiện **đối soát (reconciliation)** và khắc phục mọi điểm không nhất quán. Đây cũng là một yêu cầu.

Thông qua những câu hỏi này, chúng ta đã hiểu rõ các yêu cầu chức năng và phi chức năng. Trong buổi phỏng vấn này, chúng ta tập trung thiết kế một hệ thống thanh toán hỗ trợ các chức năng sau.

### Yêu cầu chức năng
* **Quy trình thu tiền (Pay-in flow):** Hệ thống thanh toán nhận tiền thanh toán của buyer thay mặt cho seller.

* **Quy trình chuyển tiền (Pay-out flow):** Hệ thống thanh toán chuyển tiền cho seller trên toàn cầu.


### Yêu cầu phi chức năng
* **Độ tin cậy và khả năng chịu lỗi:** Phải xử lý phù hợp các trường hợp thanh toán thất bại.

* **Quy trình đối soát:** Hệ thống phải hỗ trợ cơ chế đối soát bất đồng bộ giữa các service nội bộ (thanh toán, accounting, v.v.) và service bên ngoài (payment provider). Quy trình này xác minh bất đồng bộ tính nhất quán của thông tin thanh toán giữa các hệ thống.

### Ước tính sơ bộ

Hệ thống cần xử lý 1,000,000 giao dịch mỗi ngày, tức là
$$
\frac{1{,}000{,}000\ \text{transactions}}{10^5\ \text{seconds}} = 10\ \text{transactions per second (TPS)}
$$
Có nghĩa là khoảng $10\ \text{transactions per second (TPS)}$. Đối với một database điển hình, $10\ \text{TPS}$ không phải là con số tải cao, điều này có nghĩa trọng tâm của thiết kế lần này là **xử lý giao dịch thanh toán đúng cách**, chứ không phải theo đuổi throughput cao.

## Bước 2 - Đề xuất thiết kế cấp cao và nhận sự đồng thuận

Ở cấp độ tổng quan, quy trình thanh toán có thể được chia thành hai giai đoạn để phản ánh dòng tiền:

* **Quy trình thu tiền (Pay-in flow)**  
* **Quy trình chuyển tiền (Pay-out flow)**  

Lấy Amazon làm ví dụ: sau khi buyer đặt hàng, tiền trước tiên chảy vào tài khoản ngân hàng của Amazon, đây là quy trình thu tiền. Mặc dù tiền tạm thời nằm trong tài khoản của Amazon, phần lớn số tiền thuộc về seller; Amazon chỉ tạm giữ tiền và thu phí dịch vụ. Khi hàng được giao và tiền có thể được giải ngân, Amazon chuyển số dư sau khi trừ phí từ tài khoản ngân hàng của mình sang tài khoản của seller, quy trình này là pay-out.
  Hình 1 minh họa dòng tiền thu và chuyển tiền được đơn giản hóa.

![Figure11.1](../../images/v2/chapter11/Figure11.1.png)



### Quy trình thu tiền (Pay-in flow)

Sơ đồ thiết kế cấp cao của quy trình tiền vào (Pay-in) được trình bày trong Hình 2. Hãy cùng xem vai trò cụ thể của từng component trong hệ thống.

![Figure11.2](../../images/v2/chapter11/Figure11.2.png)

#### Payment Service
Payment Service chịu trách nhiệm tiếp nhận payment event của người dùng và điều phối toàn bộ quy trình thanh toán. Trước tiên, service thực hiện kiểm tra rủi ro (Risk Check) để đảm bảo tuân thủ các yêu cầu pháp lý như chống rửa tiền (AML) và chống tài trợ khủng bố (CFT)[2], đồng thời phát hiện các hành vi đáng ngờ như rửa tiền hoặc tài trợ khủng bố. Payment Service chỉ xử lý các payment request vượt qua kiểm tra rủi ro. Kiểm tra rủi ro thường do service bên thứ ba chuyên nghiệp cung cấp vì lĩnh vực này phức tạp và đòi hỏi chuyên môn cao.

#### Payment Executor
Payment Executor chịu trách nhiệm thực hiện một payment order thông qua payment service provider (PSP). Một payment event có thể chứa nhiều payment order.

#### Payment Service Provider (PSP)
PSP chịu trách nhiệm chuyển tiền từ tài khoản A sang tài khoản B. Trong kịch bản được đơn giản hóa này, PSP trừ tiền từ tài khoản thẻ tín dụng của buyer.

#### Card Schemes
Card Schemes là các tổ chức chịu trách nhiệm xử lý giao dịch thẻ tín dụng, chẳng hạn Visa, MasterCard, Discover, v.v. Chúng tạo thành một hệ sinh thái khổng lồ và phức tạp[3].

#### Ledger
Ledger ghi lại thông tin tài chính của từng giao dịch thanh toán. Ví dụ, khi người dùng thanh toán $1 cho seller, sổ sách ghi nợ -$1 vào tài khoản người dùng và ghi có +$1 vào tài khoản seller. Ledger rất quan trọng cho việc phân tích tài chính, tính doanh thu của website và dự báo trong tương lai.

#### Wallet
Wallet duy trì số dư tài khoản của merchant và có thể ghi lại tổng số tiền thanh toán tích lũy của từng người dùng.

Như Hình 2 minh họa, một quy trình thu tiền điển hình diễn ra như sau:  

1. Khi người dùng nhấp nút “Đặt hàng”, một payment event được tạo và gửi đến Payment Service.  
2. Payment Service lưu payment event vào database.  
3. Nếu một payment event chứa nhiều payment order (ví dụ một lần checkout chứa sản phẩm của nhiều seller), Payment Service gọi Payment Executor cho từng order.  
4. Payment Executor lưu thông tin payment order vào database.  
5. Payment Executor gọi PSP bên ngoài để xử lý thanh toán bằng thẻ tín dụng.  
6. Khi Payment Executor thực thi thành công, Payment Service cập nhật Wallet, ghi lại số dư khả dụng của seller.  
7. Wallet Service ghi thông tin số dư đã cập nhật vào database.  
8. Khi Wallet cập nhật thành công, Payment Service gọi Ledger để cập nhật sổ sách.  
9. Ledger Service ghi nối tiếp thông tin sổ sách mới vào database.

### Thiết kế API của Payment Service

Payment Service tuân theo quy chuẩn thiết kế RESTful API.

#### POST /v1/payments
Thực hiện một payment event (một payment event có thể chứa nhiều order). Ví dụ về request parameter:

![Table11.1](../../images/v2/chapter11/Table11.1.png)

Trong đó, cấu trúc của mỗi `payment_order` như sau:

![Table11.2](../../images/v2/chapter11/Table11.2.png)

**Lưu ý:** `payment_order_id` là duy nhất trên phạm vi toàn cầu. Khi Payment Executor gửi payment request đến PSP bên thứ ba, PSP dùng `payment_order_id` làm mã nhận diện chống trùng lặp, còn gọi là “idempotency key”.

Có thể bạn nhận thấy kiểu dữ liệu của trường “amount” là string thay vì double. Sử dụng double không phù hợp vì các lý do sau:  

1. Các hệ thống khác nhau có thể có sai khác về độ chính xác khi serialize và deserialize, dẫn đến sai số làm tròn.  

2. Giá trị có thể cực lớn (chẳng hạn GDP của Nhật Bản khoảng \(5 \times 10^{14}\) yen) hoặc cực nhỏ (chẳng hạn đơn vị nhỏ nhất của Bitcoin, satoshi = \(10^{-8}\)).  

Vì vậy, nên sử dụng string trong quá trình truyền tải và lưu trữ dữ liệu, chỉ chuyển đổi sang dạng số khi hiển thị hoặc tính toán.

#### GET /v1/payments/{id}

API này trả về trạng thái thực thi của một payment order dựa trên `payment_order_id`.  

Thiết kế payment API ở trên có phong cách tương tự API của một số PSP nổi tiếng. Nếu muốn tìm hiểu thiết kế payment API toàn diện hơn, có thể tham khảo tài liệu chính thức của Stripe [5]

### Mô hình dữ liệu của Payment Service

Chúng ta cần hai bảng: **Payment Event** và **Payment Order**. Khi lựa chọn giải pháp lưu trữ cho hệ thống thanh toán, **performance thường không phải yếu tố quan trọng nhất**. Thay vào đó, chúng ta quan tâm hơn đến những khía cạnh sau:

1. Tính ổn định đã được kiểm chứng. Hệ thống lưu trữ này đã được các công ty tài chính lớn khác sử dụng trong nhiều năm (chẳng hạn hơn 5 năm) và nhận được phản hồi tích cực chưa?
2. Sự phong phú của các công cụ hỗ trợ, chẳng hạn công cụ monitoring và troubleshooting.
3. Mức độ trưởng thành của thị trường việc làm cho database administrator (DBA). Khả năng tuyển được DBA có kinh nghiệm là một yếu tố cân nhắc rất quan trọng.

Thông thường, chúng ta ưu tiên database quan hệ truyền thống hỗ trợ transaction ACID hơn là NoSQL hoặc NewSQL. Payment Event table chứa thông tin chi tiết về payment event. Cấu trúc của nó như sau:

![Table11.3](../../images/v2/chapter11/Table11.3.png)

![Table11.4](../../images/v2/chapter11/Table11.4.png)

Trước khi đi sâu vào các bảng này, hãy xem một số thông tin nền.

* **checkout_id** là foreign key. Một lần checkout tạo ra một payment event, và event này có thể chứa nhiều payment order.
* Khi gọi payment service provider (PSP) bên thứ ba để trừ tiền từ thẻ tín dụng của buyer, tiền không được chuyển trực tiếp vào tài khoản của seller. Thay vào đó, tiền trước tiên đi vào tài khoản ngân hàng của website thương mại điện tử; quy trình này được gọi là thu tiền (pay-in). Khi thỏa mãn điều kiện chuyển tiền (pay-out condition) (chẳng hạn hàng đã được giao), seller sẽ khởi tạo pay-out, lúc đó tiền mới được chuyển từ tài khoản ngân hàng của website thương mại điện tử sang tài khoản ngân hàng của seller. Vì vậy, trong quy trình thu tiền, chúng ta chỉ cần thông tin thẻ ngân hàng của buyer, không cần thông tin tài khoản ngân hàng của seller.

Trong Payment Order table (Bảng 4), *payment_order_status* là một kiểu enum dùng để lưu trạng thái thực thi của payment order. Các trạng thái thực thi gồm: NOT_STARTED (chưa bắt đầu), EXECUTING (đang thực thi), SUCCESS (thành công),FAILED (thất bại). Logic cập nhật như sau:

1. Trạng thái ban đầu của payment order là **NOT_STARTED**.  

2. Khi Payment Service gửi payment order cho Payment Executor, trạng thái được cập nhật thành **EXECUTING**.  

3. Payment Service cập nhật trạng thái thành **SUCCESS** hoặc **FAILED** dựa trên response của Payment Executor.  


Khi trạng thái payment order là **SUCCESS**, Payment Service gọi Wallet Service để cập nhật số dư tài khoản của seller và cập nhật trường **wallet_updated** thành **TRUE**. Ở đây, chúng ta đơn giản hóa thiết kế bằng cách giả định việc cập nhật Wallet luôn thành công.  

Sau khi hoàn tất, bước tiếp theo của Payment Service là gọi Ledger Service để cập nhật database sổ cái và cập nhật trường **ledger_updated** thành **TRUE**.  

Khi tất cả payment order có cùng **checkout_id** đã được xử lý thành công, Payment Service cập nhật trường **is_payment_done** trong Payment Event table thành **TRUE**. Thông thường sẽ có một scheduled job chạy theo khoảng thời gian cố định để monitoring trạng thái của các payment order đang xử lý. Nếu một payment order chưa hoàn tất trong khoảng thời gian ngưỡng, hệ thống sẽ gửi cảnh báo để engineer điều tra.

### Hệ thống Ledger kép (Double-entry Ledger System)

Trong hệ thống ledger có một nguyên tắc thiết kế rất quan trọng: nguyên tắc ghi sổ kép (còn được gọi là double-entry hoặc double-entry bookkeeping [6]). Hệ thống ghi sổ kép là nền tảng của mọi hệ thống thanh toán và là yếu tố then chốt để đảm bảo sổ sách chính xác. Hệ thống ghi lại mỗi giao dịch thanh toán vào hai tài khoản ledger độc lập với số tiền hoàn toàn giống nhau: một tài khoản được ghi nợ (debit), tài khoản còn lại được ghi có (credit) cùng số tiền đó (xem Bảng 5).

![Table11.5](../../images/v2/chapter11/Table11.5.png)

Hệ thống ghi sổ kép quy định rằng tổng debit và credit của tất cả bản ghi giao dịch phải bằng 0. Thiếu một xu có nghĩa là một tài khoản khác thừa một xu. Cơ chế này cung cấp khả năng truy vết end-to-end và đảm bảo tính nhất quán trong toàn bộ quy trình thanh toán. Nếu muốn tìm hiểu cách triển khai hệ thống ghi sổ kép, có thể tham khảo engineering blog của Square: “immutable double-entry accounting database service” [7].

### Hosted Payment Page

Hầu hết các công ty không muốn lưu trữ thông tin thẻ tín dụng nội bộ, vì khi làm vậy họ phải tuân thủ nhiều quy định phức tạp, chẳng hạn Payment Card Industry Data Security Standard (PCI DSS) của Hoa Kỳ [8]. Để tránh trực tiếp xử lý thông tin thẻ tín dụng, các công ty thường sử dụng hosted payment page do Payment Service Provider (PSP) cung cấp. Với website, hosted page thường được nhúng dưới dạng widget hoặc iframe; với mobile app, đó có thể là pre-built page do payment SDK cung cấp. Hình 3 minh họa một ví dụ về quy trình checkout tích hợp với PayPal. Điểm mấu chốt là: hosted payment page do PSP cung cấp sẽ trực tiếp thu thập thông tin thẻ tín dụng của khách hàng, thay vì xử lý thông qua Payment Service của chúng ta.

![Figure11.3](../../images/v2/chapter11/Figure11.3.png)



### Quy trình chuyển tiền (Pay-out Flow)

Các component của pay-out flow rất tương tự pay-in flow. Điểm khác biệt chính giữa hai quy trình là: trong pay-in flow, chúng ta sử dụng PSP (payment service provider) để chuyển tiền từ thẻ tín dụng của buyer vào tài khoản ngân hàng của website thương mại điện tử; còn trong pay-out flow, chúng ta sử dụng pay-out provider bên thứ ba để chuyển tiền từ tài khoản ngân hàng của website thương mại điện tử vào tài khoản ngân hàng của seller.

Thông thường, hệ thống thanh toán sử dụng một accounts payable service provider bên thứ ba (chẳng hạn Tipalti [9]) để xử lý pay-out. Vì pay-out cũng liên quan đến một lượng lớn bản ghi kế toán và các yêu cầu tuân thủ pháp lý.

## Bước 3: Đi sâu vào thiết kế (Design Deep Dive)

Trong phần này, chúng ta sẽ tập trung tìm hiểu cách làm cho hệ thống thanh toán nhanh hơn, đáng tin cậy hơn và an toàn hơn. Trong distributed system, lỗi và sự cố không chỉ có thể xảy ra mà còn rất phổ biến. Ví dụ, nếu người dùng nhấp nút “Thanh toán” nhiều lần thì có bị trừ tiền nhiều lần không? Nếu thanh toán bị gián đoạn do vấn đề mạng thì phải xử lý thế nào? Tiếp theo, chúng ta sẽ phân tích sâu các chủ đề quan trọng sau:

- Tích hợp với Payment Service Provider (PSP)  
- Đối soát (Reconciliation)  
- Ứng phó với độ trễ xử lý thanh toán  
- Cách giao tiếp giữa các service nội bộ  
- Cơ chế xử lý thanh toán thất bại  
- Phân phối chính xác một lần (Exactly-once Delivery)  
- Tính nhất quán (Consistency)  
- Bảo mật (Security)

### Tích hợp PSP (PSP Integration)

Nếu hệ thống thanh toán có thể kết nối trực tiếp với ngân hàng hoặc card scheme (như Visa, MasterCard), hệ thống có thể hoàn tất thanh toán mà không phụ thuộc vào PSP. Tuy nhiên, cách này tốn kém và yêu cầu nghiêm ngặt, nên thường chỉ các công ty lớn mới áp dụng. Với phần lớn doanh nghiệp, hệ thống sẽ tích hợp với PSP theo một trong hai cách sau:

1. Nếu một công ty có khả năng lưu trữ an toàn thông tin thanh toán nhạy cảm và lựa chọn làm vậy, công ty có thể tích hợp PSP (payment service provider) vào hệ thống thông qua API. Công ty phải chịu trách nhiệm phát triển trang thanh toán, thu thập và lưu trữ thông tin thanh toán nhạy cảm; còn PSP chịu trách nhiệm kết nối với ngân hàng hoặc card scheme (chẳng hạn Visa, MasterCard).
2. Nếu một công ty lựa chọn không lưu trữ thông tin thanh toán nhạy cảm vì các yêu cầu pháp lý phức tạp hoặc lý do bảo mật, PSP sẽ cung cấp hosted payment page để thu thập thông tin thanh toán bằng thẻ tín dụng và lưu trữ an toàn trong hệ thống PSP. Đây là cách được phần lớn công ty sử dụng.

Chúng ta sẽ dùng Hình 4 để giải thích chi tiết cách hosted payment page hoạt động.

![Figure11.4](../../images/v2/chapter11/Figure11.4.png)

Để đơn giản hóa phần giải thích, Hình 4 bỏ qua Payment Executor, Ledger và Wallet. Payment Service chịu trách nhiệm điều phối toàn bộ quy trình thanh toán.

1. Người dùng nhấp nút “checkout” trong browser của client, client gửi thông tin payment order đến Payment Service.  

2. Sau khi nhận thông tin payment order, Payment Service gửi payment registration request đến PSP (payment service provider). Request này chứa các thông tin liên quan đến thanh toán, chẳng hạn amount, currency, thời điểm hết hạn của payment request và redirect URL. Vì mỗi payment order chỉ có thể được đăng ký một lần, request này chứa một trường UUID để đảm bảo “đăng ký chính xác một lần (exactly-once registration)”. UUID này còn được gọi là nonce [10], và thường chính là ID duy nhất của payment order.
  
3. PSP trả về một token cho Payment Service. Token này là một UUID ở phía PSP, dùng để nhận diện duy nhất lần đăng ký thanh toán này. Sau đó, chúng ta có thể sử dụng token để truy vấn lần đăng ký thanh toán và trạng thái thực thi của nó.
  
4. Trước khi gọi hosted payment page của PSP, Payment Service lưu token vào database.

5. Sau khi token được lưu, client hiển thị payment page do PSP host. Ứng dụng mobile thường thực hiện chức năng này thông qua SDK của PSP. Ở đây lấy web integration của Stripe làm ví dụ (xem Hình 5). Stripe cung cấp một JavaScript library để hiển thị payment UI, thu thập thông tin thanh toán nhạy cảm và trực tiếp gọi PSP để hoàn tất thanh toán. Mọi thông tin thanh toán nhạy cảm đều do Stripe thu thập và không đi qua Payment Service của chúng ta. Hosted payment page thường cần hai phần thông tin sau:  
   1. Token nhận được ở Bước 4. JavaScript code của PSP sử dụng token này để lấy thông tin chi tiết của payment request từ backend của PSP, trong đó một thông tin quan trọng là số tiền cần thu.  
   
   2. Redirect URL. Đây là URL của trang web sẽ được chuyển đến sau khi thanh toán hoàn tất. Khi JavaScript code của PSP hoàn tất thanh toán, browser sẽ được redirect đến URL này. Thông thường, redirect URL là trang trạng thái checkout trên website thương mại điện tử, dùng để hiển thị kết quả thanh toán. Lưu ý rằng redirect URL khác với webhook URL ở Bước 9 [11].

![Figure11.5](../../images/v2/chapter11/Figure11.5.png)

6. Người dùng điền thông tin thanh toán như số thẻ tín dụng, tên chủ thẻ, ngày hết hạn, v.v. trên trang web do PSP host, sau đó nhấp nút “Thanh toán”. PSP ngay lập tức bắt đầu xử lý quy trình thanh toán.  

7. PSP trả về trạng thái thanh toán.  

8. Sau đó, trang web được redirect đến redirect URL. Trạng thái thanh toán nhận được ở Bước 7 thường được đính kèm vào cuối URL này. Ví dụ, redirect URL đầy đủ có thể là:  
   https://your-company.com/?tokenID=JIOUIQ123NSF&payResult=X324FSa
   
9. PSP cũng gửi trạng thái thanh toán bất đồng bộ đến Payment Service thông qua webhook (callback). Webhook này là URL được đăng ký khi hệ thống cấu hình PSP ban đầu, dùng để PSP báo cáo kết quả thanh toán cho hệ thống thanh toán. Khi hệ thống thanh toán nhận payment event qua webhook, hệ thống trích xuất thông tin trạng thái thanh toán và cập nhật trường `payment_order_status` trong Payment Order table ở database.  

Cho đến đây, chúng ta đã trình bày “quy trình lý tưởng” của hosted payment page. Nhưng trong thực tế, kết nối mạng có thể không ổn định và bất kỳ bước nào trong chín bước trên cũng có thể thất bại. Có phương pháp hệ thống nào để xử lý các trường hợp thất bại này không? Câu trả lời là: đối soát (Reconciliation).

### Đối soát (Reconciliation)

Khi các component của hệ thống giao tiếp bất đồng bộ, chúng ta không thể đảm bảo message chắc chắn được gửi đi, cũng không thể đảm bảo chắc chắn nhận được response. Tình huống này rất phổ biến trong nghiệp vụ thanh toán vì hệ thống thanh toán thường sử dụng giao tiếp bất đồng bộ để cải thiện performance. Các hệ thống bên ngoài (chẳng hạn PSP hoặc ngân hàng) cũng có xu hướng sử dụng giao tiếp bất đồng bộ. Vậy trong trường hợp này, chúng ta đảm bảo tính đúng đắn của hệ thống bằng cách nào?

Câu trả lời là: đối soát (Reconciliation). Đối soát là việc định kỳ so sánh trạng thái giữa các service liên quan để xác minh dữ liệu của chúng có nhất quán hay không. Đây thường là tuyến phòng thủ cuối cùng trong hệ thống thanh toán.

Mỗi tối, PSP hoặc ngân hàng gửi cho khách hàng một settlement file. File này chứa số dư tài khoản ngân hàng trong ngày và tất cả bản ghi giao dịch phát sinh trong ngày. Hệ thống đối soát phân tích settlement file và so sánh nó với dữ liệu trong Ledger System. Hình bên dưới (Hình 6) minh họa vị trí của quy trình đối soát trong toàn bộ hệ thống thanh toán.

![Figure11.6](../../images/v2/chapter11/Figure11.6.png)

Đối soát cũng được dùng để xác minh tính nhất quán nội bộ của hệ thống thanh toán. Ví dụ, trạng thái trong ledger và wallet có thể bị lệch; chúng ta có thể dùng hệ thống đối soát để phát hiện những khác biệt này.

Để sửa các mismatch được phát hiện trong quá trình đối soát, chúng ta thường dựa vào đội ngũ tài chính để manual adjustment. Những mismatch và adjustment này thường được chia thành ba loại:

1. Chênh lệch có thể phân loại và tự động điều chỉnh (Classifiable & Automatable). Trong trường hợp này, chúng ta biết nguyên nhân của chênh lệch và cũng biết cách khắc phục, đồng thời việc viết chương trình để tự động thực hiện adjustment là đáng giá. Engineer có thể tự động hóa cả hai bước phân loại và điều chỉnh chênh lệch.  

2. Chênh lệch có thể phân loại nhưng không thể tự động điều chỉnh (Classifiable but Non-Automatable). Trong trường hợp này, chúng ta biết nguyên nhân của chênh lệch và cũng biết cách khắc phục, nhưng chi phí viết chương trình tự động điều chỉnh quá cao. Chênh lệch sẽ được đưa vào job queue để đội ngũ tài chính sửa thủ công.  

3. Chênh lệch không thể phân loại (Unclassifiable). Trong trường hợp này, chúng ta không biết chênh lệch phát sinh như thế nào. Chênh lệch sẽ được đưa vào special job queue để đội ngũ tài chính điều tra và xử lý thủ công.

### Xử lý độ trễ xử lý thanh toán (Handling Payment Processing Delays)

Như đã thảo luận ở trên, một payment request end-to-end đi qua nhiều component và liên quan đến nhiều hệ thống nội bộ lẫn bên ngoài. Trong phần lớn trường hợp, payment request hoàn tất trong vài giây, nhưng đôi khi payment request có thể bị treo, thậm chí cần vài giờ hoặc vài ngày mới hoàn tất hoặc bị từ chối.  
Sau đây là một số tình huống phổ biến khiến payment request mất nhiều thời gian:

- PSP (payment service provider) cho rằng payment request có rủi ro cao và cần manual review.
- Thẻ tín dụng cần xác minh bảo mật bổ sung, chẳng hạn 3D Secure authentication [13], yêu cầu chủ thẻ cung cấp thêm thông tin để xác minh giao dịch mua.

Payment Service phải có khả năng xử lý những payment request cần nhiều thời gian để hoàn tất. Nếu trang mua hàng được một PSP bên ngoài host (điều này hiện nay rất phổ biến), PSP sẽ xử lý các payment request chạy lâu theo những cách sau:

* PSP trả về trạng thái pending cho client. Client hiển thị trạng thái này cho người dùng, đồng thời cung cấp một trang để khách hàng có thể xem trạng thái thanh toán hiện tại bất cứ lúc nào.  
* PSP theo dõi payment request pending đó thay mặt chúng ta và thông báo mọi cập nhật trạng thái thanh toán thông qua webhook callback URL mà Payment Service cung cấp khi đăng ký.  

Khi payment request cuối cùng hoàn tất, PSP gọi webhook đã đề cập ở trên; sau khi nhận thông báo, Payment Service cập nhật các hệ thống nội bộ và tiếp tục xử lý nghiệp vụ tiếp theo, chẳng hạn giao hàng cho khách hàng.

Ngoài ra, một số PSP không dùng webhook để thông báo kết quả thanh toán mà yêu cầu Payment Service chủ động polling PSP để lấy các cập nhật trạng thái mới nhất của mọi payment request pending.

### Giao tiếp giữa các service nội bộ (Communication among internal services)

Thông thường có hai mô hình giao tiếp giữa các service nội bộ: giao tiếp đồng bộ (synchronous) và giao tiếp bất đồng bộ (asynchronous). Dưới đây lần lượt giới thiệu hai cách này.

#### Giao tiếp đồng bộ (Synchronous communication)

Giao tiếp đồng bộ (chẳng hạn HTTP call) hoạt động tốt trong các hệ thống quy mô nhỏ, nhưng nhược điểm sẽ dần bộc lộ khi quy mô hệ thống tăng lên. Cách này hình thành một chuỗi request-response dài giữa nhiều service, khiến performance và độ tin cậy tổng thể của hệ thống bị hạn chế.

Các nhược điểm chính của giao tiếp đồng bộ gồm:

* Performance thấp (Low performance): Nếu một service nào đó trong call chain có performance kém, tốc độ response của toàn hệ thống sẽ bị ảnh hưởng.
* Cách ly lỗi kém (Poor failure isolation): Nếu PSP (payment service provider) hoặc service dependency khác gặp sự cố, client sẽ không nhận được response.
* Coupling chặt (Tight coupling): Bên gửi request phải biết thông tin cụ thể của bên nhận, khiến việc mở rộng hoặc thay thế service trở nên khó khăn.
* Khó scale (Hard to scale): Nếu không sử dụng message queue làm tầng đệm, hệ thống sẽ khó ứng phó với lượng traffic lớn đột biến.

#### Giao tiếp bất đồng bộ (Asynchronous communication)

Giao tiếp bất đồng bộ có thể được chia thành hai loại:

* Single receiver: Mỗi request (message) chỉ được một receiver hoặc service xử lý. Mô hình này thường được triển khai thông qua shared message queue. Message queue có thể có nhiều subscriber, nhưng khi một message được xử lý xong, nó sẽ bị xóa khỏi queue. Hãy xem một ví dụ cụ thể: trong Hình 9, Service A và Service B đều subscribe cùng một shared message queue. Sau khi message m1 được Service A consume và message m2 được Service B consume, cả hai message đều bị xóa khỏi queue, như Hình 10 minh họa.

  ![Figure11.8](../../images/v2/chapter11/Figure11.8.png)

* Multiple receivers: Mỗi request (message) được nhiều receiver hoặc service xử lý. Trong tình huống này, Kafka hoạt động rất tốt.

  Khi consumer nhận message, message **không** bị xóa khỏi Kafka, vì vậy cùng một message có thể được các service khác nhau xử lý đồng thời. Mô hình này rất phù hợp với hệ thống thanh toán vì cùng một request có thể kích hoạt nhiều “side effect”, chẳng hạn gửi push notification, cập nhật báo cáo tài chính, kích hoạt thống kê analytics, v.v. Như Hình 11 minh họa, đây là một ví dụ điển hình: payment event được publish lên Kafka, sau đó được các service khác nhau (như payment system, analytics system, billing system, v.v.) cùng consume.

  ![Figure11.9](../../images/v2/chapter11/Figure11.9.png)

Nhìn chung, thiết kế giao tiếp đồng bộ (synchronous communication) đơn giản hơn, nhưng không cho phép service đạt được tính tự chủ thực sự (autonomous). Khi dependency graph trong hệ thống không ngừng mở rộng, performance tổng thể sẽ dần suy giảm. Giao tiếp bất đồng bộ (asynchronous communication) hy sinh sự đơn giản trong thiết kế và tính nhất quán dữ liệu ở một mức độ nhất định để đổi lấy khả năng mở rộng (scalability) và khả năng phục hồi sau lỗi (failure resilience) cao hơn. Với một hệ thống thanh toán lớn có business logic phức tạp và phụ thuộc vào nhiều service bên thứ ba, giao tiếp bất đồng bộ rõ ràng là lựa chọn tốt hơn.

### Xử lý thanh toán thất bại (Handling Failed Payments)

Mọi hệ thống thanh toán đều phải xử lý các giao dịch thất bại. Độ tin cậy và khả năng chịu lỗi là những yêu cầu then chốt. Sau đây, chúng ta sẽ xem lại một số kỹ thuật ứng phó với các thách thức này.

#### Theo dõi trạng thái thanh toán (Tracking payment state)

Ở mọi giai đoạn trong vòng đời thanh toán, việc có một trạng thái thanh toán rõ ràng là vô cùng quan trọng. Mỗi khi xảy ra sự cố, chúng ta có thể xác định trạng thái hiện tại của giao dịch thanh toán và phán đoán có cần retry hoặc refund hay không. Trạng thái thanh toán có thể được lưu trong một bảng database append-only để đảm bảo bản ghi không bị sửa đổi.

#### Retry queue và Dead letter queue (Retry queue and Dead letter queue)

Để xử lý các trường hợp thất bại một cách linh hoạt, chúng ta sử dụng retry queue và dead letter queue như minh họa trong Hình 12.

- Retry queue: Các lỗi có thể retry (chẳng hạn lỗi tạm thời) được route vào retry queue.
- Dead letter queue: Nếu một message vẫn thất bại sau nhiều lần retry, cuối cùng nó sẽ được đưa vào dead letter queue. Dead letter queue rất hữu ích cho debugging và cô lập các message có vấn đề, giúp chúng ta kiểm tra và xác định tại sao những message này không được xử lý thành công.

![Figure11.10](../../images/v2/chapter11/Figure11.10.png)

1. Kiểm tra xem sự cố có thể retry hay không.

   1a. Sự cố có thể retry được route vào retry queue.

   1b. Với sự cố không thể retry (chẳng hạn input không hợp lệ), thông tin lỗi được lưu vào database.

2. Hệ thống thanh toán đọc event từ retry queue và retry các giao dịch thanh toán thất bại.

3. Nếu giao dịch thanh toán lại thất bại:

   3a. Nếu số lần retry chưa vượt quá ngưỡng, event được route trở lại retry queue.

   3b. Nếu số lần retry vượt quá ngưỡng, event được đưa vào dead letter queue. Những event thất bại này có thể cần được điều tra thêm.

Nếu bạn quan tâm đến một ví dụ thực tế sử dụng các queue này, có thể tìm hiểu hệ thống thanh toán của Uber, hệ thống sử dụng Kafka để đáp ứng yêu cầu về độ tin cậy và khả năng chịu lỗi [16].

### Phân phối chính xác một lần (Exactly-once Delivery)

Một trong những vấn đề nghiêm trọng nhất mà hệ thống thanh toán có thể gặp phải là trừ tiền khách hàng nhiều lần. Trong thiết kế hệ thống, phải đảm bảo hệ thống thanh toán có thể **“thực thi chính xác một lần” (exactly-once)** payment instruction.[16]

Thoạt nhìn, việc triển khai “exactly-once” có vẻ rất khó, nhưng nếu chia bài toán thành hai phần thì sẽ dễ hơn nhiều. Về mặt toán học, để một operation “thực thi chính xác một lần”, nó phải đồng thời thỏa mãn hai điều kiện sau:

1. Thực thi ít nhất một lần (at-least-once);
2. Thực thi nhiều nhất một lần (at-most-once).

Chúng ta sẽ giải thích cách dùng “retry” để đạt được “at-least-once”, và cách dùng “idempotency check” để đạt được “at-most-once”.

#### Retry

Đôi khi do lỗi mạng hoặc timeout, chúng ta cần retry giao dịch thanh toán. Cơ chế retry có thể đảm bảo “at-least-once”. Ví dụ, như Hình 13 minh họa, client thử thực hiện một khoản thanh toán 10 dollar nhưng request liên tục thất bại do kết nối mạng kém. Trong ví dụ này, mạng cuối cùng khôi phục và request thành công ở lần thử thứ tư

![Figure11.11](../../images/v2/chapter11/Figure11.11.png)

Việc quyết định khoảng thời gian giữa các lần retry rất quan trọng. Sau đây là một số chiến lược retry phổ biến.

* Retry ngay: Client gửi lại request ngay lập tức.
* Khoảng thời gian cố định: Chờ một khoảng thời gian cố định giữa lúc thanh toán thất bại và lần retry mới.
* Khoảng thời gian tăng dần: Client chờ một khoảng thời gian ngắn trước lần retry đầu tiên, sau đó tăng dần thời gian chờ ở các lần retry tiếp theo.
* Exponential backoff [17]: Sau mỗi lần retry thất bại, tăng gấp đôi thời gian chờ giữa các lần retry. Ví dụ, sau khi request đầu tiên thất bại, chúng ta retry sau 1 giây; nếu lần thứ hai thất bại, retry sau 2 giây; nếu lần thứ ba thất bại, retry sau 4 giây.
* Hủy: Client có thể hủy request. Đây là cách thường dùng khi sự cố mang tính vĩnh viễn hoặc khả năng request lặp lại thành công rất thấp.

Xác định chiến lược retry phù hợp không dễ. Không có một giải pháp “phù hợp cho mọi trường hợp”. Nhìn chung, nếu vấn đề mạng khó có khả năng được giải quyết trong thời gian ngắn, có thể sử dụng exponential backoff. Retry quá thường xuyên sẽ lãng phí tài nguyên tính toán và có thể khiến service quá tải. Một best practice là cung cấp error code kèm header Retry-After trong response.

Một vấn đề tiềm ẩn của retry là thanh toán trùng lặp. Hãy xem hai tình huống.

**Tình huống 1:** Hệ thống thanh toán tích hợp với PSP thông qua hosted payment page và client liên tiếp nhấp nút “Thanh toán” hai lần.

**Tình huống 2:** Thanh toán được PSP xử lý thành công, nhưng response không đến được Payment Service của chúng ta do lỗi mạng. Người dùng lại nhấp nút “Thanh toán”, hoặc client tự động retry thanh toán.

Để tránh thanh toán trùng lặp, payment operation phải được thực thi nhiều nhất một lần. Đảm bảo “thực thi nhiều nhất một lần” này còn được gọi là idempotency.

#### Idempotency

Idempotency là yếu tố then chốt để đảm bảo “thực thi nhiều nhất một lần”. Theo định nghĩa của Wikipedia, idempotency là một thuộc tính trong toán học và computer science của một số operation, theo đó operation có thể được thực thi nhiều lần mà không làm thay đổi kết quả sau lần thực thi đầu tiên. Ở góc độ API, idempotency có nghĩa là client có thể thực hiện cùng một call nhiều lần và nhận được cùng một kết quả.

Trong giao tiếp giữa client (web và mobile app) với server, idempotency key thường là một giá trị duy nhất do client tạo ra và hết hạn sau một khoảng thời gian. UUID thường được dùng làm idempotency key và được nhiều công ty công nghệ (chẳng hạn Stripe và PayPal) khuyến nghị. Để thực hiện một payment request idempotent, có thể thêm idempotency key vào HTTP request header, ví dụ: <idempotency-key: key_value>.

Bây giờ chúng ta đã hiểu khái niệm cơ bản về idempotency, hãy xem nó giúp giải quyết vấn đề thanh toán trùng lặp được đề cập ở trên như thế nào.

**Tình huống 1:** Điều gì xảy ra nếu khách hàng nhanh chóng nhấp nút “Thanh toán” hai lần?

Như Hình 14 minh họa, khi người dùng nhấp nút “Thanh toán”, một idempotency key được gửi đến hệ thống thanh toán như một phần của HTTP request. Trong website thương mại điện tử, idempotency key thường là ID của shopping cart trước khi checkout.

Đối với request thứ hai, hệ thống coi đó là một retry vì Payment Service đã thấy idempotency key giống vậy. Khi chúng ta đưa idempotency key đã chỉ định trước đó vào request header, Payment Service sẽ trả về trạng thái mới nhất của request trước.

![Figure11.12](../../images/v2/chapter11/Figure11.12.png)

Nếu phát hiện nhiều request đồng thời sử dụng cùng một idempotency key, hệ thống chỉ xử lý một request, các request còn lại nhận status code “429 Too Many Requests”.

Để hỗ trợ idempotency, chúng ta có thể tận dụng unique key constraint của database. Ví dụ, có thể dùng primary key của database table làm idempotency key. Cơ chế hoạt động như sau:

1. Khi hệ thống thanh toán nhận một payment request, hệ thống thử insert một record vào database table.
2. Nếu insert thành công, đó là một payment request mới mà trước đó hệ thống chưa xử lý.
3. Nếu insert thất bại vì primary key giống vậy đã tồn tại, điều đó có nghĩa hệ thống đã xử lý payment request này trước đó. Khi đó, request thứ hai sẽ không được xử lý lại.

**Tình huống 2: Payment đã được PSP xử lý thành công, nhưng do lỗi mạng, response không trả về được Payment Service của chúng ta, sau đó người dùng lại nhấp nút “Thanh toán”.**

Như Hình 4 (Bước 2 và Bước 3) minh họa, Payment Service gửi một nonce ngẫu nhiên đến PSP, PSP trả về một token tương ứng. Nonce này nhận diện duy nhất payment order, còn token nhận diện duy nhất nonce đó, vì vậy token cũng ánh xạ duy nhất đến payment order.

Khi người dùng lại nhấp nút “Thanh toán”, payment order không đổi, vì vậy token gửi đến PSP cũng giống nhau. Vì phía PSP sử dụng token này làm idempotency key, PSP có thể nhận diện đây là một payment trùng lặp và trả về kết quả trạng thái của lần thực thi trước.

### Tính nhất quán (Consistency)

Trong một lần thực thi thanh toán, nhiều stateful service được gọi:

1. Payment Service: Lưu dữ liệu liên quan đến thanh toán, chẳng hạn nonce, token, payment order, trạng thái thực thi, v.v.
2. Ledger: Lưu toàn bộ dữ liệu kế toán.
3. Wallet: Lưu số dư tài khoản của merchant.
4. Payment Service Provider (PSP): Lưu trạng thái thực thi thanh toán.
5. Để tăng độ tin cậy, dữ liệu có thể được replicate giữa các database replica khác nhau.

Trong distributed environment, giao tiếp giữa bất kỳ hai service nào cũng có thể thất bại, dẫn đến data inconsistency. Sau đây, chúng ta sẽ xem một số kỹ thuật phổ biến dùng để giải quyết vấn đề data inconsistency trong hệ thống thanh toán.

Để duy trì tính nhất quán dữ liệu giữa các service nội bộ, việc đảm bảo xử lý exactly-once là rất quan trọng. Điều này có nghĩa là mỗi payment operation chỉ được xử lý một lần, không bị thực thi trùng lặp và cũng không bị bỏ sót.

Để duy trì tính nhất quán dữ liệu giữa service nội bộ và service bên ngoài (PSP), chúng ta thường dựa vào idempotency và reconciliation. Nếu service bên ngoài hỗ trợ idempotency, khi retry thanh toán, chúng ta phải sử dụng cùng idempotency key. Ngay cả khi service bên ngoài hỗ trợ idempotent API, chúng ta vẫn cần thực hiện đối soát vì không nên giả định kết quả của hệ thống bên ngoài luôn chính xác.

Nếu dữ liệu được replicate, replication delay có thể gây ra data inconsistency giữa primary database và replica. Thông thường có hai cách để giải quyết vấn đề này:

1. Chỉ sử dụng primary database để xử lý request đọc và ghi. Cách này đơn giản khi cài đặt, nhưng nhược điểm hiển nhiên là khả năng mở rộng kém. Replica chỉ được dùng để đảm bảo độ tin cậy dữ liệu chứ không gánh traffic, dẫn đến lãng phí tài nguyên.
2. Đảm bảo tất cả replica luôn đồng bộ. Chúng ta có thể sử dụng các consensus algorithm như Paxos[21] hoặc Raft[22], hoặc sử dụng distributed database dựa trên consensus như YugabyteDB[23] hoặc CockroachDB[24].

### Bảo mật thanh toán (Payment Security)

Bảo mật thanh toán rất quan trọng. Trong phần cuối của thiết kế hệ thống này, chúng ta sẽ giới thiệu ngắn gọn một số kỹ thuật dùng để phòng chống network attack và đánh cắp thẻ tín dụng.

![Table16.](../../images/v2/chapter11/Table11.6.png)

## Bước 4 - Tóm tắt

Trong chương này, chúng ta đã tìm hiểu pay-in flow và pay-out flow. Chúng ta đi sâu vào retry, idempotency và consistency. Ở cuối chương, chúng ta cũng thảo luận về xử lý lỗi thanh toán và các nội dung liên quan đến bảo mật.

Hệ thống thanh toán cực kỳ phức tạp. Mặc dù đã đề cập đến nhiều chủ đề, vẫn còn một số nội dung đáng được thảo luận thêm. Dưới đây là một số chủ đề tiêu biểu nhưng không đầy đủ.

* **Monitoring**: Monitoring các metric quan trọng là một phần rất quan trọng trong các application hiện đại. Với monitoring đầy đủ, chúng ta có thể trả lời những câu hỏi như: “Tỷ lệ thành công trung bình của một phương thức thanh toán là bao nhiêu?”, “Mức sử dụng CPU của server là bao nhiêu?”, v.v. Chúng ta có thể tạo và hiển thị các metric này trên monitoring dashboard.
* Alerting: Khi hệ thống có dấu hiệu bất thường, việc thông báo kịp thời cho developer trực on-call là rất quan trọng để họ có thể nhanh chóng phản hồi.
* **Debugging Tools**: “Tại sao thanh toán thất bại?” là một câu hỏi phổ biến. Để engineer và customer service dễ dàng troubleshooting hơn, việc phát triển các công cụ có thể xem trạng thái giao dịch, lịch sử xử lý của server, record của PSP, v.v. là rất quan trọng.
* **Currency Exchange**: Khi thiết kế hệ thống thanh toán cho nhóm người dùng quốc tế, currency exchange là một yếu tố cần cân nhắc quan trọng.
* **Geography**: Các khu vực khác nhau có thể có những phương thức thanh toán hoàn toàn khác nhau.
* **Cash Payment**: Thanh toán bằng tiền mặt rất phổ biến ở Ấn Độ, Brazil và một số quốc gia khác. Uber [28] và Airbnb [29] từng viết các engineering blog chi tiết về cách họ xử lý phương thức thanh toán dựa trên tiền mặt.
* **Tích hợp Google Pay / Apple Pay.**: Nếu quan tâm, có thể tham khảo tài liệu [30] để biết thêm thông tin.

Chúc mừng bạn đã đọc xong chương này! Bây giờ hãy tự vỗ tay hoặc vỗ nhẹ lên vai mình để tự khen thưởng. Làm tốt lắm!

### Tóm tắt chương

![Summary.png](../../images/v2/chapter11/Figure11.13.png)

## Tài liệu tham khảo

[1] Payment system: https://en.wikipedia.org/wiki/Payment_system

[2] AML/CFT: https://en.wikipedia.org/wiki/Money_laundering

[3] Card scheme: https://en.wikipedia.org/wiki/Card_scheme

[4] ISO 4217: https://en.wikipedia.org/wiki/ISO_4217

[5] Stripe API Reference: https://stripe.com/docs/api

[6] Double-entry bookkeeping: https://en.wikipedia.org/wiki/Double-entry_bookkeeping

[7] Books, an immutable double-entry accounting database service:
https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/

[8] Payment Card Industry Data Security Standard:
https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard

[9] Tipalti: https://tipalti.com/

[10] Nonce: https://en.wikipedia.org/wiki/Cryptographic_nonce

[11] Webhooks: https://stripe.com/docs/webhooks

[12] Customize your success page: https://stripe.com/docs/payments/checkout/custom-success-page

[13] 3D Secure: https://en.wikipedia.org/wiki/3-D_Secure

[14] Kafka Connect Deep Dive – Error Handling and Dead Letter Queues:
https://www.confluent.io/blog/kafka-connect-deep-dive-error-handling-dead-letter-queues/

[15] Reliable Processing in a Streaming Payment System:
https://www.youtube.com/watch?v=5TD8m7w1xE0&list=PLLEUtp5eGr7Dz3fWGUpiSiG3d_WgJe-KJ

[16] Chain Services with Exactly-Once Guarantees:
https://www.confluent.io/blog/chain-services-exactly-guarantees/

[17] Exponential backoff: https://en.wikipedia.org/wiki/Exponential_backoff

[18] Idempotence: https://en.wikipedia.org/wiki/Idempotence

[19] Stripe idempotent requests: https://stripe.com/docs/api/idempotent_requests

[20] Idempotency: https://developer.paypal.com/docs/platforms/develop/idempotency/

[21] Paxos: https://en.wikipedia.org/wiki/Paxos_(computer_science)

[22] Raft: https://raft.github.io/

[23] YugabyteDB: https://www.yugabyte.com/

[24] Cockroachdb:https://www.cockroachlabs.com/

[25] What is DDoS attack: https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/

[26] How Payment Gateways Can Detect and Prevent Online Fraud: https://www.chargebee.com/blog/optimize-online-billing-stop-online-fraud/

[27] Advanced Technologies for Detecting and Preventing Fraud at Uber: https://eng.uber.com/advanced-technologies-detecting-preventing-fraud-uber/

[28] Re-Architecting Cash and Digital Wallet Payments for India with Uber Engineering: https://eng.uber.com/india-payments/

[29] Scaling Airbnb’s Payment Platform: https://medium.com/airbnb-engineering/scaling-airbnbs-payment-platform-43ebfc99b324

[30] Payments Integration at Uber: A Case Study: https://www.youtube.com/watch?v=yooCE5B0SRA
