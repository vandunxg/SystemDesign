# Ví kỹ thuật số

Nền tảng thanh toán thường cung cấp dịch vụ ví kỹ thuật số cho khách hàng, để họ có thể nạp tiền vào ví và sử dụng sau đó. Ví dụ, bạn có thể nạp tiền từ tài khoản ngân hàng vào ví kỹ thuật số, rồi chọn dùng tiền trong ví để thanh toán khi mua sản phẩm trực tuyến.

![Hình 12.1: Ví kỹ thuật số](../images/v2/chapter12/Figure_12.1.png)

Chi tiêu không phải là chức năng duy nhất mà ví kỹ thuật số cung cấp. Với các nền tảng thanh toán như PayPal, chúng ta có thể chuyển tiền trực tiếp vào ví của người khác trên cùng nền tảng thanh toán. So với chuyển khoản giữa các ngân hàng, chuyển tiền trực tiếp giữa các ví nhanh hơn và quan trọng nhất là thường không phát sinh phí bổ sung.

![Hình 12.2: Chuyển số dư giữa các ví](../images/v2/chapter12/Figure_12.2.png)

Giả sử chúng ta được yêu cầu thiết kế backend cho một ứng dụng ví kỹ thuật số hỗ trợ thao tác chuyển số dư giữa các ví. Khi bắt đầu buổi phỏng vấn, chúng ta sẽ xác định yêu cầu bằng cách đặt các câu hỏi làm rõ.

## Bước 1 - Hiểu vấn đề và xác định phạm vi thiết kế

**Ứng viên:** Chúng ta chỉ cần tập trung vào thao tác chuyển số dư giữa hai ví kỹ thuật số hay cần xem xét các chức năng khác?

**Người phỏng vấn:** Chúng ta chỉ tập trung vào thao tác chuyển số dư.

**Ứng viên:** Hệ thống cần hỗ trợ bao nhiêu giao dịch mỗi giây (TPS)?

**Người phỏng vấn:** Giả sử cần hỗ trợ 1,000,000 TPS.

**Ứng viên:** Ví kỹ thuật số có yêu cầu nghiêm ngặt về tính đúng đắn. Chúng ta có thể giả định rằng đảm bảo transactional [1] là đủ không?

**Người phỏng vấn:** Nghe hợp lý.

**Ứng viên:** Chúng ta có cần chứng minh tính đúng đắn không?

**Người phỏng vấn:** Câu hỏi hay. Tính đúng đắn thường chỉ có thể được xác minh sau khi giao dịch hoàn tất. Một cách xác minh là so sánh bản ghi nội bộ với sao kê ngân hàng. Hạn chế của việc đối soát là nó chỉ cho thấy sự khác biệt, chứ không cho biết sự khác biệt phát sinh như thế nào. Vì vậy, chúng ta muốn thiết kế một hệ thống có khả năng tái hiện, nghĩa là luôn có thể xây dựng lại số dư lịch sử bằng cách replay dữ liệu từ đầu.

**Ứng viên:** Chúng ta có thể giả định yêu cầu availability là 99.99% không?

**Người phỏng vấn:** Nghe hợp lý.

**Ứng viên:** Có cần xem xét ngoại hối không?

**Người phỏng vấn:** Không cần, việc đó nằm ngoài phạm vi.

### Tóm tắt

Tóm lại, ví kỹ thuật số của chúng ta cần hỗ trợ:

- Hỗ trợ thao tác chuyển số dư giữa hai ví kỹ thuật số.
- Hỗ trợ 1,000,000 TPS.
- Độ tin cậy ít nhất là 99.99%.
- Hỗ trợ transaction.
- Hỗ trợ khả năng tái hiện.

### Ước tính sơ bộ

Khi nói về TPS, điều đó có nghĩa là sẽ sử dụng transactional database. Ngày nay, relational database chạy trên node điển hình của data center có thể hỗ trợ vài nghìn transaction mỗi giây. Ví dụ, tài liệu tham khảo [2] có benchmark hiệu năng của một số transactional database server phổ biến. Giả sử một database node có thể hỗ trợ 1,000 TPS. Để đạt 1 triệu TPS, chúng ta cần 1,000 database node.

Tuy nhiên, phép tính này hơi lệch. Mỗi lệnh chuyển tiền cần hai thao tác: trừ tiền từ một tài khoản và cộng tiền vào tài khoản khác. Để hỗ trợ 1 triệu lượt chuyển tiền mỗi giây, hệ thống thực tế phải xử lý tới 2 triệu TPS, nghĩa là cần 2,000 node.

| TPS trên một node | Số node |
| ---------- | -------- |
| 100        | 20,000   |
| 1,000      | 2,000    |
| 10,000     | 200      |

**Bảng 12.1: Ánh xạ giữa TPS trên một node và số node**

## Bước 2 - Đề xuất thiết kế cấp cao và nhận phê duyệt

Trong phần này, chúng ta sẽ thảo luận:

- Thiết kế API
- Ba thiết kế cấp cao
  1. Giải pháp đơn giản trong memory
  2. Giải pháp distributed transaction dựa trên database
  3. Giải pháp event sourcing có khả năng tái hiện

### Thiết kế API

Chúng ta sẽ sử dụng đặc tả RESTful API. Trong buổi phỏng vấn này, chúng ta chỉ cần hỗ trợ một API:

| API                              | Chi tiết                             |
| -------------------------------- | -------------------------------- |
| POST /v1/wallet/balance_transfer | Chuyển số dư từ ví này sang ví khác |

**Các tham số request:**

| Field           | Mô tả          | Kiểu                 |
| -------------- | ------------- | -------------------- |
| from_account   | Tài khoản bị trừ tiền      | string               |
| to_account     | Tài khoản nhận tiền      | string               |
| amount         | Số tiền          | string               |
| currency       | Loại tiền tệ      | string (ISO 4217[3]) |
| transaction_id | ID dùng để deduplicate | uuid                 |

**Body response mẫu:**

```json
{
  "Status": "success",
  "Transaction_id": "81589980-2664-11ec-9621-0242ac130002"
}
```

Đáng lưu ý là kiểu dữ liệu của field “amount” là “string”, không phải “double”. Chúng ta đã giải thích lý do trong chương 11, Hệ thống thanh toán ([trang 320](./CHAPTER 11：Payment System.md#APIs-for-payment-service)).  
Trong thực tế, nhiều người vẫn chọn biểu diễn bằng số thực hoặc số double vì hầu như mọi ngôn ngữ lập trình và database đều hỗ trợ chúng. Đây là lựa chọn phù hợp miễn là chúng ta hiểu các rủi ro tiềm ẩn của việc mất độ chính xác.

**Giải pháp phân mảnh trong memory**  
Ứng dụng ví duy trì số dư tài khoản cho từng tài khoản người dùng. Một cấu trúc dữ liệu tốt để biểu diễn quan hệ <người dùng, số dư> này là map, còn gọi là hash table hoặc key-value store.  
Đối với memory storage, một lựa chọn phổ biến là Redis. Một Redis node không đủ để xử lý 1 triệu TPS. Chúng ta cần xây dựng một cluster các Redis node và phân phối đều các tài khoản người dùng trong đó. Quá trình này được gọi là partition hoặc sharding.  
Để phân phối key-value data vào n partition, chúng ta có thể tính hash của key rồi chia cho n. Phần dư là partition đích. Pseudocode sau minh họa quá trình sharding:  

```java
String accountID = "A";  
Int partitionNumber = 7;  
Int myPartition = accountID.hashCode() % partitionNumber;
```

Số partition và địa chỉ của tất cả Redis node có thể được lưu ở một nơi tập trung. Chúng ta có thể dùng ZooKeeper [4] làm giải pháp configuration storage có high availability.  
Component cuối cùng của giải pháp là service xử lý các lệnh chuyển tiền. Chúng ta gọi nó là wallet service, với một số trách nhiệm chính.  

1. Nhận lệnh chuyển tiền  
2. Validate lệnh chuyển tiền  
3. Nếu lệnh hợp lệ, cập nhật số dư tài khoản của hai người dùng tham gia chuyển tiền. Trong cluster, số dư tài khoản có thể nằm trên các Redis node khác nhau

Wallet service là stateless. Nó có thể horizontal scale dễ dàng. Hình 12.3 minh họa giải pháp trong memory.  

![Hình 12.3: Giải pháp trong memory](../images/v2/chapter12/Figure_12.3.png)  

Trong ví dụ này, chúng ta có 3 Redis node. Có ba client A, B và C. Số dư tài khoản của họ được phân phối đều trên ba Redis node. Ví dụ này có hai wallet service node xử lý các request chuyển số dư. Khi một wallet service node nhận được lệnh chuyển $1 từ client A sang client B, nó gửi hai lệnh đến hai Redis node. Với Redis node chứa tài khoản của client A, wallet service trừ $1 khỏi tài khoản. Với client B, wallet service cộng $1 vào tài khoản.

**Ứng viên:** Trong thiết kế này, số dư tài khoản được phân phối trên nhiều Redis node. ZooKeeper được dùng để duy trì thông tin sharding. Stateless wallet service dùng thông tin sharding để định vị Redis node của client rồi cập nhật số dư tài khoản tương ứng.  

**Người phỏng vấn:** Thiết kế này khả thi, nhưng không đáp ứng yêu cầu về tính đúng đắn của chúng ta. Wallet service cập nhật hai Redis node cho mỗi lần chuyển tiền. Không thể đảm bảo cả hai update đều thành công. Ví dụ, nếu wallet service node bị crash sau khi update đầu tiên hoàn tất nhưng trước khi update thứ hai hoàn tất, giao dịch chuyển tiền sẽ không đầy đủ. Hai update này cần được thực hiện trong một atomic transaction.



### Distributed transaction

#### Database sharding
Làm thế nào để khiến các update trên hai storage node khác nhau có tính atomic? Bước đầu tiên là thay mỗi Redis node bằng một transactional relational database node. Hình 12.4 minh họa kiến trúc này. Lần này, client A, B và C được phân vùng vào 3 relational database thay vì 3 Redis node.

![Hình 12.4: Relational database](../images/v2/chapter12/Figure_12.4.png)

Chỉ sử dụng transactional database mới chỉ giải quyết được một phần vấn đề. Như đã đề cập ở phần trước, một lệnh chuyển tiền rất có thể cần update hai tài khoản trong hai database khác nhau. Không thể đảm bảo hai thao tác update được xử lý đồng thời. Nếu wallet service restart ngay sau khi update số dư tài khoản đầu tiên, làm sao chúng ta đảm bảo tài khoản thứ hai cũng được update?

### Distributed transaction: two-phase commit
Trong distributed system, một transaction có thể liên quan đến nhiều process trên nhiều node. Để transaction có tính atomic, distributed transaction có thể là câu trả lời. Có hai cách triển khai distributed transaction: giải pháp low-level và giải pháp high-level. Chúng ta sẽ lần lượt tìm hiểu.

Giải pháp low-level dựa vào chính database. Algorithm phổ biến nhất được gọi là two-phase commit (2PC). Đúng như tên gọi, nó có hai phase, như minh họa trong Hình 12.5.

![Hình 12.5: Two-phase commit (nguồn [5])](../images/v2/chapter12/Figure_12.5.png)

1. Coordinator (trong ví dụ của chúng ta là wallet service) thực hiện các thao tác đọc/ghi trên nhiều database như bình thường. Như minh họa trong Hình 12.5, database A và C đều bị lock.
2. Khi application sẵn sàng commit transaction, coordinator yêu cầu tất cả database prepare transaction.
3. Trong phase thứ hai, coordinator thu thập reply từ tất cả database và thực hiện các thao tác sau:
   (a) Nếu tất cả database trả lời “yes”, coordinator yêu cầu tất cả database commit các transaction mà chúng đã nhận.
   (b) Nếu bất kỳ database nào trả lời “no”, coordinator yêu cầu tất cả database abort transaction.

Đây là giải pháp low-level vì bước prepare cần có các sửa đổi đặc biệt đối với database transaction. Ví dụ, có một chuẩn X/Open XA [6] để điều phối các database không đồng nhất nhằm triển khai 2PC. Vấn đề lớn nhất của 2PC là hiệu năng kém vì lock có thể bị giữ trong thời gian dài khi chờ message từ các node khác. Một vấn đề khác của 2PC là coordinator có thể trở thành single point of failure, như minh họa trong Hình 12.6.

![Hình 12.6: Coordinator bị crash](../images/v2/chapter12/Figure_12.6.png)

### Distributed transaction: Try-Confirm/Cancel (TC/C)
TC/C là một compensating transaction [7], gồm hai bước:
1. Trong phase đầu tiên, coordinator yêu cầu tất cả database reserve resource cho transaction.
2. Trong phase thứ hai, coordinator thu thập reply từ tất cả database:
   (a) Nếu tất cả database trả lời “yes”, coordinator yêu cầu tất cả database confirm thao tác, tức quá trình Try-Confirm.
   (b) Nếu bất kỳ database nào trả lời “no”, coordinator yêu cầu tất cả database cancel thao tác, tức quá trình Try-Cancel.

Cần lưu ý rằng hai phase của 2PC được bọc trong cùng một transaction, còn trong TC/C, mỗi phase là một transaction độc lập.

#### Ví dụ TC/C
Dễ giải thích cách TC/C hoạt động hơn bằng một ví dụ thực tế. Giả sử chúng ta muốn chuyển $1 từ tài khoản A sang tài khoản C. Bảng 12.2 tóm tắt việc thực thi TC/C trong từng phase.

| Phase | Thao tác | Thay đổi số dư tài khoản A | Thay đổi số dư tài khoản C |
| ---- | ---- | ----------------- | ----------------- |
| 1    | Try | -$1               | Không thao tác            |
| 2    | Confirm | Không thao tác            | +$1               |
|      | Cancel | +$1               | Không thao tác            |

**Bảng 12.2: Ví dụ TC/C**

Giả sử wallet service là coordinator của TC/C. Khi distributed transaction bắt đầu, số dư tài khoản A là $1 và số dư tài khoản C là $0.

##### Phase đầu tiên: Try
Trong phase Try, wallet service (với vai trò coordinator) gửi hai transaction command đến hai database:
1. Với database chứa tài khoản A, coordinator khởi động một local transaction để giảm số dư tài khoản A đi $1.
2. Với database chứa tài khoản C, coordinator gửi một lệnh no-op (NOP). Database không thực hiện thao tác nào với lệnh NOP và luôn trả lời coordinator bằng message thành công.

Phase Try được minh họa trong Hình 12.7. Nét đậm biểu thị các lock mà transaction đang giữ.

![Hình 12.7: Phase Try](../images/v2/chapter12/Figure_12.7.png)

##### Phase thứ hai: Confirm
Nếu cả hai database đều trả lời “yes”, wallet service chuyển sang phase Confirm.
Số dư tài khoản A đã được update trong phase đầu tiên, nên wallet service không cần thay đổi số dư trong phase này. Tuy nhiên, tài khoản C chưa nhận $1 từ tài khoản A trong phase đầu tiên. Trong phase Confirm, wallet service cần cộng $1 vào số dư tài khoản C.

Quá trình Confirm được minh họa trong Hình 12.8.

![Hình 12.8: Phase Confirm](../images/v2/chapter12/Figure_12.8.png)

##### Phase thứ hai: Cancel
Điều gì xảy ra nếu phase Try thất bại? Trong ví dụ trên, chúng ta giả định thao tác NOP của tài khoản C luôn thành công, nhưng trong thực tế nó có thể thất bại. Ví dụ, tài khoản C có thể là tài khoản bất hợp lệ, cơ quan quản lý cấm tiền đi vào hoặc đi ra khỏi tài khoản đó. Trong trường hợp này, distributed transaction phải được cancel và chúng ta cần cleanup.

Vì số dư tài khoản A đã được update trong transaction của phase Try, wallet service không thể cancel transaction đã hoàn tất. Việc duy nhất nó có thể làm là khởi động một transaction khác để đảo ngược tác động của transaction phase Try, tức cộng lại $1 vào tài khoản A.

Vì tài khoản C chưa được update trong phase Try, wallet service chỉ cần gửi thao tác NOP đến database của tài khoản C.

Quá trình Cancel được minh họa trong Hình 12.9.

![Hình 12.9: Phase Cancel](../images/v2/chapter12/Figure_12.9.png)

### So sánh 2PC và TC/C
Bảng 12.3 cho thấy 2PC và TC/C có nhiều điểm tương đồng nhưng cũng có khác biệt. Trong 2PC, khi phase thứ hai bắt đầu, tất cả local transaction đều chưa hoàn tất (vẫn đang bị lock), còn trong TC/C, tất cả local transaction đều đã hoàn tất (đã unlock). Nói cách khác, phase thứ hai của 2PC là để hoàn tất các transaction chưa hoàn tất (chẳng hạn abort hoặc commit), còn trong TC/C, phase thứ hai là để dùng các thao tác ngược nhằm triệt tiêu kết quả của transaction trước đó khi xảy ra lỗi. Bảng dưới đây tóm tắt khác biệt giữa chúng.

|      | Phase đầu tiên           | Phase thứ hai: thành công   | Phase thứ hai: thất bại         |
| ---- | ------------------ | ---------------- | ---------------------- |
| 2PC  | Local transaction chưa hoàn tất     | Commit tất cả local transaction | Cancel tất cả local transaction       |
| TC/C | Tất cả local transaction đã hoàn tất | Thực hiện local transaction mới | Đảo ngược tác dụng phụ của transaction đã commit |

**Bảng 12.3: So sánh 2PC và TC/C**

TC/C còn được gọi là compensating distributed transaction. Đây là giải pháp high-level vì compensation (còn gọi là “undo”) được triển khai trong business logic. Ưu điểm của cách tiếp cận này là không phụ thuộc database. Chỉ cần database hỗ trợ transaction thì TC/C có thể hoạt động. Nhược điểm là phải quản lý chi tiết của distributed transaction và xử lý sự phức tạp của nó trong business logic ở application layer.

#### Phase state table
Chúng ta vẫn chưa trả lời câu hỏi đã đặt ra trước đó: nếu wallet service restart giữa chừng trong TC/C thì sao? Khi restart, toàn bộ lịch sử thao tác trước đó có thể bị mất và hệ thống có thể không biết cách khôi phục.

Giải pháp rất đơn giản. Chúng ta có thể lưu tiến độ của TC/C dưới dạng phase state trong transactional database. Phase state ít nhất phải bao gồm các thông tin sau:
- ID và nội dung của distributed transaction.
- Trạng thái phase Try của mỗi database. Trạng thái có thể là “chưa gửi”, “đã gửi” và “đã nhận reply”.
- Tên của phase thứ hai. Có thể là “Confirm” hoặc “Cancel”. Có thể tính tên này từ kết quả của phase Try.
- Trạng thái của phase thứ hai.
- Một out-of-order flag (sẽ giải thích sau trong phần “Out-of-order execution”).

Phase state table nên được đặt ở đâu? Thông thường, chúng ta lưu phase state trong database chứa wallet account bị trừ tiền. Kiến trúc được cập nhật được minh họa trong Hình 12.10.

![Hình 12.10: Phase state table](../images/v2/chapter12/Figure_12.10.png)

#### Trạng thái mất cân bằng
Bạn có nhận thấy rằng khi phase Try kết thúc, $1 đã biến mất (Hình 12.11) không?
Giả sử mọi thứ diễn ra suôn sẻ, khi phase Try kết thúc, $1 đã bị trừ khỏi tài khoản A, khiến tổng tiền ít hơn so với lúc TC/C bắt đầu. Điều này vi phạm nguyên tắc cơ bản của kế toán rằng tổng sau giao dịch phải được giữ nguyên.

Tin tốt là TC/C vẫn duy trì transactional guarantee. TC/C bao gồm nhiều local transaction độc lập. Vì TC/C được application điều khiển, chính application có thể nhìn thấy các kết quả trung gian giữa những local transaction này. Mặt khác, database transaction hoặc phiên bản distributed transaction dùng 2PC được database duy trì nên application cấp cao không nhìn thấy chúng.

Trong quá trình thực thi distributed transaction, sẽ luôn xuất hiện một số trạng thái data inconsistency. Những trạng thái không nhất quán này có thể trong suốt đối với chúng ta vì các hệ thống low-level như database đã sửa chúng. Nếu không, chúng ta phải tự xử lý (ví dụ TC/C).

Trạng thái mất cân bằng được minh họa trong Hình 12.11.

![Hình 12.11: Trạng thái mất cân bằng](../images/v2/chapter12/Figure_12.11.png)

#### Thứ tự thao tác hợp lệ
Có ba lựa chọn cho phase Try:

| Lựa chọn phase Try | Tài khoản A | Tài khoản C |
| ------------ | ------ | ------ |
| Lựa chọn 1       | -$1    | Không thao tác |
| Lựa chọn 2       | NOP    | +$1    |
| Lựa chọn 3       | -$1    | +$1    |

**Bảng 12.4: Lựa chọn phase Try**

Cả ba lựa chọn này đều có vẻ hợp lý, nhưng một số lựa chọn không hợp lệ.

Với lựa chọn 2, nếu phase Try của tài khoản C thành công nhưng phase Try của tài khoản A thất bại (NOP), wallet service cần chuyển sang phase Cancel. Có thể một người khác sẽ can thiệp và chuyển $1 ra khỏi tài khoản C. Khi wallet service cố trừ $1 khỏi tài khoản C, nó sẽ phát hiện không còn tiền, vi phạm transactional guarantee của distributed transaction.

Với lựa chọn 3, nếu $1 được trừ khỏi tài khoản A đồng thời cộng vào tài khoản C, điều đó sẽ tạo ra nhiều phức tạp. Ví dụ, $1 đã được cộng vào tài khoản C nhưng không thể trừ khỏi tài khoản A. Trong trường hợp này, chúng ta phải làm gì?

Vì vậy, lựa chọn 2 và lựa chọn 3 có khiếm khuyết, chỉ lựa chọn 1 là hợp lệ.

#### Out-of-order execution
Một tác dụng phụ của TC/C là out-of-order execution. Dễ giải thích hơn bằng một ví dụ.

Chúng ta dùng lại ví dụ trên, chuyển $1 từ tài khoản A sang tài khoản C. Như minh họa trong Hình 12.12, trong phase Try, thao tác trên tài khoản A thất bại và trả lỗi về wallet service; wallet service sau đó chuyển sang phase Cancel và gửi thao tác Cancel đến tài khoản A và tài khoản C.

Giả sử database xử lý tài khoản C gặp một số vấn đề về network và nhận được lệnh Cancel trước khi nhận lệnh Try. Trong trường hợp này, không có gì cần cancel.

Out-of-order execution được minh họa trong Hình 12.12.

![Hình 12.12: Out-of-order execution](../images/v2/chapter12/Figure_12.12.png)

Để xử lý các thao tác out-of-order, cho phép mỗi node cancel TC/C mà không cần nhận lệnh Try trước, bằng cách tăng cường logic hiện có như sau:
- Thao tác cancel out-of-order để lại một flag trong database, cho biết nó đã thấy thao tác Cancel nhưng chưa thấy thao tác Try.
- Thao tác Try được tăng cường để luôn kiểm tra xem có out-of-order flag hay không; nếu có thì trả về thất bại.

Đó là lý do chúng ta thêm out-of-order flag vào phase state table trong phần “Phase state table”.

### Distributed transaction: Saga
#### Thực thi theo thứ tự tuyến tính
Một giải pháp distributed transaction phổ biến khác được gọi là Saga [8]. Saga là de facto standard trong microservices architecture. Ý tưởng của Saga rất đơn giản:
1. Tất cả thao tác được sắp xếp theo thứ tự. Mỗi thao tác là một transaction độc lập trên database của chính nó.
2. Các thao tác được thực thi lần lượt từ thao tác đầu tiên đến thao tác cuối cùng. Khi một thao tác hoàn tất, nó kích hoạt thao tác tiếp theo.
3. Khi một thao tác thất bại, toàn bộ quy trình rollback từ thao tác hiện tại về thao tác đầu tiên theo thứ tự ngược lại, sử dụng compensating transaction. Vì vậy, nếu một distributed transaction có n thao tác, chúng ta cần chuẩn bị 2n thao tác: n thao tác cho trường hợp bình thường và n thao tác còn lại cho compensating transaction trong quá trình rollback.

Dễ hiểu hơn qua một ví dụ. Hình 12.13 minh họa workflow Saga để chuyển $1 từ tài khoản A sang tài khoản C. Đường ngang phía trên thể hiện thứ tự thực thi bình thường. Hai đường dọc thể hiện các thao tác hệ thống phải thực hiện khi gặp lỗi. Khi gặp lỗi, thao tác chuyển tiền sẽ được rollback và client nhận được error message. Như đã đề cập trong phần “Thứ tự thao tác hợp lệ” ở trang 352, chúng ta phải đặt thao tác trừ tiền trước thao tác cộng tiền.

![Hình 12.13: Workflow Saga](../images/v2/chapter12/Figure_12.13.png)

Chúng ta điều phối các thao tác này như thế nào? Có hai cách:
1. **Choreography (phối hợp)**. Trong microservices architecture, tất cả service tham gia distributed transaction của Saga hoàn thành công việc của mình bằng cách subscribe event từ các service khác. Vì vậy, đây là cách điều phối hoàn toàn decentralized.
2. **Orchestration (điều phối)**. Một coordinator duy nhất chỉ thị cho tất cả service hoàn thành công việc theo đúng thứ tự.

Việc chọn mô hình điều phối nào phụ thuộc vào business requirement và mục tiêu. Thách thức của choreography solution là các service giao tiếp hoàn toàn async, nên mỗi service phải duy trì một state machine nội bộ để biết cần làm gì khi service khác phát event. Khi có nhiều service, việc quản lý có thể trở nên khó khăn. Orchestration solution xử lý sự phức tạp tốt, vì vậy thường là lựa chọn ưu tiên trong hệ thống ví kỹ thuật số.

#### So sánh TC/C và Saga
TC/C và Saga đều là distributed transaction ở application level. Bảng 12.5 tóm tắt điểm tương đồng và khác biệt của chúng.

|                        | TC/C       | Saga           |
| ---------------------- | ---------- | -------------- |
| Compensating operation               | Trong phase Cancel | Trong phase rollback     |
| Central coordination               | Có         | Có (orchestration mode) |
| Thứ tự thực thi thao tác               | Bất kỳ       | Tuyến tính           |
| Có thể thực thi song song               | Có         | Không (thực thi tuyến tính) |
| Có thể nhìn thấy trạng thái không nhất quán một phần | Có         | Có             |
| Application hay database logic       | Application       | Application           |

**Bảng 12.5: So sánh TC/C và Saga**

Trong thực tế, chúng ta nên dùng loại nào? Câu trả lời phụ thuộc vào yêu cầu latency. Như Bảng 12.5 cho thấy, các thao tác trong Saga phải được thực thi theo thứ tự tuyến tính, còn trong TC/C chúng có thể được thực thi song song. Vì vậy, quyết định phụ thuộc vào các yếu tố sau:
1. Nếu không có yêu cầu về latency hoặc có rất ít service (chẳng hạn ví dụ chuyển tiền của chúng ta), chúng ta có thể chọn một trong hai. Nếu muốn đi theo xu hướng microservices architecture, hãy chọn Saga.
2. Nếu hệ thống nhạy với latency và có nhiều service/thao tác, TC/C có thể là lựa chọn tốt hơn.

**Ứng viên:** Để chuyển số dư có tính transactional, chúng ta thay Redis bằng relational database và dùng TC/C hoặc Saga để triển khai distributed transaction.

**Người phỏng vấn:** Làm tốt! Giải pháp distributed transaction hoạt động, nhưng trong một số trường hợp có thể không hiệu quả. Ví dụ, user có thể nhập thao tác sai ở application level. Trong trường hợp này, số tiền được chỉ định có thể sai. Chúng ta cần một cách để truy nguyên root cause của vấn đề và audit mọi thao tác trên tài khoản. Làm thế nào để thực hiện điều đó?

---

### Event sourcing
#### Bối cảnh
Trong thực tế, nhà cung cấp ví kỹ thuật số có thể bị audit. Các auditor bên ngoài này có thể đặt những câu hỏi khó, chẳng hạn:
1. Chúng ta có biết số dư tài khoản tại bất kỳ thời điểm nào không?
2. Làm thế nào biết số dư tài khoản trong quá khứ và hiện tại là chính xác?
3. Làm thế nào chứng minh logic hệ thống vẫn đúng sau khi thay đổi code?

Một design philosophy của system có thể trả lời những câu hỏi này là event sourcing, một kỹ thuật được phát triển trong domain-driven design (DDD) [9].

#### Định nghĩa
Event sourcing có bốn thuật ngữ quan trọng:
1. **Command**
2. **Event**
3. **State**
4. **State machine**

##### Command
Command là một thao tác dự kiến đến từ thế giới bên ngoài. Ví dụ, nếu muốn chuyển $1 từ client A sang client C, request chuyển tiền này là một command.

Trong event sourcing, thứ tự của mọi thứ đều rất quan trọng. Vì vậy, command thường được đưa vào một FIFO (first-in-first-out) queue.

##### Event
Command là một ý định chứ không phải sự thật, vì một số command có thể không hợp lệ và không thể thực thi. Ví dụ, nếu số dư tài khoản trở thành số âm sau khi chuyển tiền, thao tác chuyển tiền sẽ thất bại.

Trước khi thực hiện bất kỳ thao tác nào, command phải được validate. Khi command vượt qua bước validate, nó hợp lệ và phải được thực thi. Kết quả thực thi được gọi là event.

Có hai khác biệt chính giữa command và event:
1. Event phải được thực thi vì chúng đại diện cho các sự thật đã được xác thực. Trong thực tế, chúng ta thường mô tả event ở thì quá khứ. Nếu command là “chuyển $1 từ A sang C”, thì event tương ứng là “đã chuyển $1 từ A sang C”.
2. Command có thể chứa randomness hoặc I/O, nhưng event phải deterministic. Event đại diện cho sự thật lịch sử.

Quá trình tạo event có hai thuộc tính quan trọng:
1. Một command có thể tạo ra bất kỳ số lượng event nào. Nó có thể tạo ra zero hoặc nhiều event.
2. Việc tạo event có thể chứa randomness, nghĩa là không đảm bảo một command luôn tạo ra cùng các event. Việc tạo event có thể chứa external I/O hoặc random number. Chúng ta sẽ quay lại thảo luận chi tiết hơn về thuộc tính này ở cuối chương.

Thứ tự event phải tuân theo thứ tự command. Vì vậy, event cũng được lưu trong FIFO queue.

##### State
State là thứ sẽ thay đổi khi apply event. Trong wallet system, state là tên hoặc ID của tài khoản, còn value là số dư tài khoản. State có thể được xem như một key-value store, trong đó key là primary key và value là table row.

##### State machine
State machine điều khiển quá trình event sourcing. Nó có hai chức năng chính:
1. Validate command và tạo event.
2. Apply event để update state.

Event sourcing yêu cầu behavior của state machine phải deterministic. Vì vậy, bản thân state machine không nên chứa randomness. Ví dụ, nó không nên dùng I/O để đọc dữ liệu ngẫu nhiên từ bên ngoài hoặc dùng random number. Khi apply event vào state, nó luôn phải tạo ra cùng một kết quả.

Hình 12.14 thể hiện static view của kiến trúc event sourcing. State machine chịu trách nhiệm chuyển command thành event và apply event. Vì state machine có hai chức năng chính, chúng ta thường vẽ hai state machine: một để validate command và một để apply event.

![Hình 12.14: Static view của event sourcing](../images/v2/chapter12/Figure_12.14.png)

Nếu thêm chiều thời gian, Hình 12.15 thể hiện dynamic view của event sourcing. System liên tục nhận command và xử lý từng command một.

![Hình 12.15: Dynamic view của event sourcing](../images/v2/chapter12/Figure_12.15.png)

#### Ví dụ wallet service
Đối với wallet service, command là request chuyển số dư. Các command này được đưa vào FIFO queue. Một lựa chọn phổ biến cho command queue là Kafka [10]. Command queue được minh họa trong Hình 12.16.

![Hình 12.16: Command queue](../images/v2/chapter12/Figure_12.16.png)

Giả sử state (số dư tài khoản) được lưu trong relational database. State machine lần lượt kiểm tra từng command theo thứ tự FIFO. Với mỗi command, nó kiểm tra tài khoản có đủ số dư hay không. Nếu có, state machine tạo một event cho mỗi tài khoản. Ví dụ, nếu command là “A→$1→C”, state machine tạo hai event: “A:-$1” và “C:+$1”.

Hình 12.17 minh họa 5 bước state machine hoạt động:
1. Đọc command từ command queue.
2. Đọc state số dư từ database.
3. Validate command. Nếu hợp lệ, tạo hai event cho mỗi tài khoản.
4. Đọc event tiếp theo.
5. Apply event bằng cách update số dư trong database.

![Hình 12.17: Cách state machine hoạt động](../images/v2/chapter12/Figure_12.17.png)

#### Khả năng tái hiện
Ưu điểm lớn nhất của event sourcing so với các kiến trúc khác là khả năng tái hiện.

Trong các giải pháp distributed transaction đã đề cập trước đó, wallet service lưu số dư tài khoản đã update (state) vào database. Rất khó biết tại sao số dư tài khoản thay đổi. Đồng thời, thông tin số dư trong quá khứ bị mất trong quá trình update. Trong thiết kế event sourcing, mọi thay đổi trước hết được lưu dưới dạng historical record bất biến. Database chỉ được dùng làm view được update của số dư tại bất kỳ thời điểm nào.

Chúng ta luôn có thể xây dựng lại state số dư trong quá khứ bằng cách replay event từ đầu. Vì danh sách event là bất biến và logic state machine là deterministic, có thể đảm bảo rằng mỗi lần replay đều tạo ra cùng một historical state.

Hình 12.18 minh họa cách tái hiện state của wallet service bằng cách replay event.

![Hình 12.18: Tái hiện state](../images/v2/chapter12/Figure_12.18.png)

Khả năng tái hiện giúp chúng ta trả lời các câu hỏi khó mà auditor đặt ra ở đầu phần này. Chúng ta nhắc lại các câu hỏi:
1. Chúng ta có biết số dư tài khoản tại bất kỳ thời điểm nào không?
2. Làm thế nào biết số dư tài khoản trong quá khứ và hiện tại là chính xác?
3. Làm thế nào chứng minh logic hệ thống vẫn đúng sau khi thay đổi code?

Với câu hỏi thứ nhất, chúng ta có thể trả lời bằng cách replay event từ đầu đến thời điểm muốn biết số dư tài khoản.

Với câu hỏi thứ hai, chúng ta có thể xác minh tính chính xác bằng cách tính lại số dư tài khoản từ danh sách event.

Với câu hỏi thứ ba, chúng ta có thể chạy các version code khác nhau trên event và xác minh xem kết quả có giống nhau không.

Nhờ khả năng audit, event sourcing thường được chọn làm de facto solution cho wallet service.

---

### Command Query Responsibility Segregation (CQRS)
Cho đến nay, chúng ta đã thiết kế wallet service để chuyển tiền hiệu quả từ tài khoản này sang tài khoản khác. Tuy nhiên, client vẫn không biết số dư tài khoản là bao nhiêu. Cần có cách publish state (thông tin số dư) để client bên ngoài event sourcing framework biết state là gì.

Theo trực giác, chúng ta có thể tạo một read-only copy của database (historical state) và chia sẻ nó với thế giới bên ngoài. Event sourcing trả lời câu hỏi này theo cách hơi khác: thay vì publish state (thông tin số dư), hãy publish tất cả event. Ý tưởng này được gọi là CQRS [11].

Trong CQRS, có một state machine phụ trách phần write của state, nhưng có nhiều read-only state machine phụ trách tạo các view của state. Những view này có thể được dùng để query.

Các read-only state machine này có thể derive các biểu diễn state khác nhau từ event queue. Ví dụ, client có thể muốn biết số dư của họ; một read-only state machine có thể lưu state trong database để phục vụ truy vấn số dư. Một state machine khác có thể xây dựng state cho một khoảng thời gian cụ thể, giúp điều tra các vấn đề như trừ tiền trùng lặp. Thông tin state là một audit trail, có thể giúp đối soát financial record.

Read-only state machine bị trễ ở một mức độ nào đó, nhưng cuối cùng sẽ bắt kịp. Kiến trúc có tính eventual consistency.

Hình 12.19 minh họa một kiến trúc CQRS kinh điển.

![Hình 12.19: Kiến trúc CQRS](../images/v2/chapter12/Figure_12.19.png)

**Ứng viên:** Trong thiết kế này, chúng ta sử dụng kiến trúc event sourcing để khiến toàn bộ system có khả năng tái hiện. Tất cả business record hợp lệ được lưu trong immutable event queue, có thể dùng để xác minh tính đúng đắn.

**Người phỏng vấn:** Tuyệt vời. Nhưng kiến trúc event sourcing bạn đề xuất chỉ xử lý một event mỗi lần và cần giao tiếp với nhiều external system. Chúng ta có thể làm nó nhanh hơn không?

# Bước 3 - Tìm hiểu sâu về thiết kế
Trong phần này, chúng ta sẽ tìm hiểu sâu các kỹ thuật để đạt hiệu năng cao, độ tin cậy và khả năng mở rộng.  

### Event sourcing hiệu năng cao  
Trong ví dụ trước, chúng ta dùng Kafka làm command và event storage, còn database làm state storage. Bây giờ hãy tìm hiểu một số cách tối ưu hóa.  

### Danh sách command và event dựa trên file  
Tối ưu hóa đầu tiên là lưu command và event vào local disk thay vì remote storage như Kafka. Điều này tránh được thời gian truyền qua network. Event list sử dụng data structure chỉ append. Append là thao tác ghi tuần tự, thường rất nhanh. Nó hoạt động tốt ngay cả với hard disk cơ học vì operating system đã tối ưu cao cho việc đọc ghi tuần tự. Theo bài viết này [12], trong một số trường hợp, truy cập disk tuần tự có thể nhanh hơn truy cập memory ngẫu nhiên. 
Tối ưu hóa thứ hai là cache command và event gần đây nhất trong memory. Như đã giải thích trước đó, chúng ta xử lý command và event ngay sau khi persist chúng. Chúng ta có thể cache chúng trong memory để tiết kiệm thời gian load từ local disk.  

Chúng ta sẽ tìm hiểu một số chi tiết triển khai. Một kỹ thuật gọi là mmap [13] rất phù hợp để triển khai các tối ưu hóa trên. Mmap có thể đồng thời ghi vào local disk và cache nội dung gần đây nhất trong memory. Nó map disk file thành array trong memory. Operating system cache một số phần của file trong memory để tăng tốc thao tác đọc ghi. Đối với file operation chỉ append, gần như có thể đảm bảo toàn bộ data được lưu trong memory, nên tốc độ rất nhanh. 
Hình 12.20 minh họa command và event storage dựa trên file. 

![](../images/v2/chapter12/Figure_12.20.png)  

### State dựa trên file 
Trong thiết kế trước, state (thông tin số dư) được lưu trong relational database. Trong production environment, database thường chạy trên server riêng và chỉ có thể truy cập qua network. Tương tự tối ưu hóa dành cho command và event, thông tin state cũng có thể được lưu vào local disk. 
Cụ thể hơn, chúng ta có thể dùng SQLite [14], một local relational database dựa trên file, hoặc RocksDB [15], một local key-value store dựa trên file. 
RocksDB được chọn vì nó sử dụng log-structured merge tree (LSM), một cấu trúc được tối ưu cho thao tác ghi. Để cải thiện hiệu năng đọc, data gần đây sẽ được cache.  
Hình 12.21 minh họa giải pháp command, event và state dựa trên file.  

![](../images/v2/chapter12/Figure_12.21.png)  

### Snapshot  
Khi mọi thứ đều dựa trên file, chúng ta xem xét cách tăng tốc quá trình tái hiện. Khi lần đầu giới thiệu khả năng tái hiện, state machine phải xử lý event từ đầu mỗi lần. Một cách tối ưu là định kỳ dừng state machine và lưu state hiện tại vào file. Việc này được gọi là snapshot. 
Snapshot là một view bất biến của historical state. Sau khi snapshot được lưu, state machine không cần bắt đầu lại từ đầu. Nó có thể đọc data từ snapshot, xác minh vị trí đã dừng lần trước và tiếp tục xử lý từ đó. 
Đối với các ứng dụng tài chính như wallet service, team tài chính thường yêu cầu chụp snapshot lúc 00:00 để có thể xác minh mọi giao dịch diễn ra trong ngày. Khi lần đầu giới thiệu CQRS của event sourcing, giải pháp là thiết lập một read-only state machine đọc từ đầu cho đến thời điểm được chỉ định. Sau khi dùng snapshot, read-only state machine chỉ cần load snapshot chứa data. 
Snapshot là một file nhị phân khổng lồ; giải pháp phổ biến là lưu nó trong object storage solution, chẳng hạn HDFS [16]. 
Hình 12.22 minh họa kiến trúc event sourcing dựa trên file. Khi mọi thứ đều dựa trên file, hệ thống có thể tận dụng tối đa I/O throughput của phần cứng máy tính.  

![](../images/v2/chapter12/Figure_12.22.png)  

Ứng viên: Chúng ta có thể tái cấu trúc thiết kế event sourcing để command list, event list, state và snapshot đều được lưu trong file. Kiến trúc event sourcing xử lý event list theo cách tuyến tính, rất phù hợp với thiết kế của hard disk và operating system cache. 
Người phỏng vấn: Hiệu năng của giải pháp local dựa trên file tốt hơn hệ thống cần truy cập data từ Kafka và database từ xa. Tuy nhiên, còn một vấn đề: vì data được lưu trên local disk, server giờ đây là stateful và trở thành single point of failure. Làm thế nào để cải thiện độ tin cậy của hệ thống?  

### Event sourcing hiệu năng cao, đáng tin cậy  
Trước khi giải thích giải pháp, hãy phân tích các phần trong hệ thống cần reliability guarantee.  

#### Phân tích độ tin cậy  
Về mặt khái niệm, mọi thứ node làm đều xoay quanh hai khái niệm: data và computation. Miễn là data persistent, có thể khôi phục kết quả computation bằng cách chạy cùng code trên node khác. Điều này có nghĩa là chúng ta chỉ cần lo lắng về độ tin cậy của data, vì nếu data bị mất thì nó sẽ mất vĩnh viễn. Độ tin cậy của hệ thống chủ yếu phụ thuộc vào độ tin cậy của data. 
Trong hệ thống của chúng ta có bốn loại data:  

1. Command dựa trên file
2. Event dựa trên file
3. State dựa trên file
4. State snapshot

Hãy xem xét kỹ cách đảm bảo độ tin cậy cho từng loại data. 
State và snapshot luôn có thể được tạo lại bằng cách replay event list. Để tăng độ tin cậy. 

Bây giờ hãy kiểm tra command. Nhìn bề ngoài, event được tạo từ command. Chúng ta có thể nghĩ rằng chỉ cần cung cấp reliability guarantee mạnh cho command là đủ. Thoạt nhìn điều này có vẻ đúng, nhưng nó bỏ qua một điều quan trọng. Việc tạo event không nhất thiết deterministic; nó có thể chứa các yếu tố ngẫu nhiên như random number, external I/O, v.v. Vì vậy, command không thể đảm bảo event có khả năng tái hiện.  

Bây giờ là lúc xem xét kỹ event. Event đại diện cho historical fact tạo ra thay đổi trong state (số dư tài khoản). Event là immutable và có thể dùng để xây dựng lại state. 
Từ phân tích này, chúng ta kết luận rằng event data là data duy nhất cần reliability guarantee cao. Chúng ta sẽ giải thích cách thực hiện điều này trong phần tiếp theo.

### Consensus
Để cung cấp độ tin cậy cao, chúng ta cần replicate event list trên nhiều node. Trong quá trình replication, chúng ta phải đảm bảo các thuộc tính sau:
1. Không mất data.
2. Relative order của data trong log file được duy trì nhất quán giữa các node.

Để đạt các đảm bảo này, replication dựa trên consensus là một lựa chọn tốt. Consensus algorithm đảm bảo nhiều node đồng thuận về nội dung event list. Hãy lấy consensus algorithm Raft [17] làm ví dụ.

Raft algorithm đảm bảo rằng chỉ cần hơn một nửa số node online, append-only list trên các node đó sẽ có cùng data. Ví dụ, nếu có 5 node và dùng Raft algorithm để đồng bộ data, chỉ cần ít nhất 3 node (nhiều hơn 1/2) online thì system vẫn có thể hoạt động bình thường, như minh họa trong Hình 12.23:

![Hình 12.23: Raft](../images/v2/chapter12/Figure_12.23.png)

Trong Raft algorithm, một node có thể đảm nhận ba role khác nhau:
1. **Leader**
2. **Candidate**
3. **Follower**

Chúng ta có thể tìm thấy implementation của Raft algorithm trong bài báo Raft. Ở đây chúng ta chỉ đề cập đến các concept cấp cao, không đi sâu vào chi tiết. Trong Raft, nhiều nhất chỉ có một node là leader của cluster, các node còn lại là follower. Leader chịu trách nhiệm nhận external command và replicate data đáng tin cậy giữa các node trong cluster.

Với Raft algorithm, chỉ cần phần lớn node online thì system đáng tin cậy. Ví dụ, nếu có 3 node, system có thể chịu được lỗi của 1 node; nếu có 5 node, system có thể chịu được lỗi của 2 node.

### Giải pháp đáng tin cậy
Nhờ replication, kiến trúc event sourcing dựa trên file của chúng ta không có single point of failure. Hãy xem các chi tiết triển khai. Hình 12.24 minh họa kiến trúc event sourcing có reliability guarantee.

![Hình 12.24: Nhóm Raft node](../images/v2/chapter12/Figure_12.24.png)

Trong Hình 12.24, chúng ta thiết lập 3 event sourcing node. Các node này dùng Raft algorithm để đồng bộ event list một cách đáng tin cậy.

Leader nhận incoming command request từ external user, chuyển chúng thành event và append event vào local event list. Raft algorithm replicate event mới được thêm đến follower.

Tất cả node (bao gồm follower) xử lý event list và update state. Raft algorithm đảm bảo leader và follower có cùng event list, còn event sourcing đảm bảo mọi state giống nhau miễn là event list giống nhau.

Một system đáng tin cậy cần xử lý graceful failure, vì vậy hãy tìm hiểu cách xử lý node crash.

Nếu leader crash, Raft algorithm tự động chọn một leader mới từ các node khỏe mạnh còn lại. Leader mới được bầu chịu trách nhiệm tiếp nhận command từ external user. Điều này đảm bảo cluster nói chung vẫn cung cấp service khi một node down.

Khi leader crash, crash có thể xảy ra trước khi command list được chuyển thành event. Trong trường hợp này, client sẽ nhận thấy vấn đề qua timeout hoặc nhận error response. Client cần gửi lại cùng command đến leader mới được bầu.

Ngược lại, xử lý follower crash đơn giản hơn nhiều. Nếu follower crash, request gửi đến nó sẽ thất bại. Raft xử lý failure bằng cách retry vô hạn cho đến khi node bị crash restart hoặc được thay thế bằng node mới.

**Ứng viên:** Trong thiết kế này, chúng ta dùng Raft consensus algorithm để replicate event list trên nhiều node. Leader nhận command và replicate event đến các node khác.

---

### Distributed event sourcing
Trong phần trước, chúng ta đã giải thích cách triển khai kiến trúc event sourcing hiệu năng cao và đáng tin cậy. Nó giải quyết vấn đề reliability, nhưng có hai hạn chế:
1. Khi digital wallet được update, chúng ta muốn nhận kết quả update ngay lập tức. Nhưng trong thiết kế CQRS, flow request/response có thể chậm. Điều này là do client không biết khi nào digital wallet được update và có thể phải dựa vào polling định kỳ.
2. Capacity của một Raft group đơn lẻ là hữu hạn. Ở một quy mô nào đó, chúng ta cần shard data và triển khai distributed transaction.

Hãy xem cách giải quyết hai vấn đề này.

### Pull và push
Trong pull model, external user định kỳ poll execution state từ read-only state machine. Model này không realtime; nếu đặt polling frequency quá cao, nó có thể làm wallet service quá tải. Hình 12.25 minh họa pull model.

![Hình 12.25: Pull định kỳ](../images/v2/chapter12/Figure_12.25.png)

Bằng cách thêm reverse proxy [18] giữa external user và event sourcing node, có thể cải thiện pull model đơn giản. Trong thiết kế này, external user gửi command, còn reverse proxy định kỳ poll execution state. Thiết kế này đơn giản hóa logic client, nhưng communication vẫn không realtime.

Hình 12.26 minh họa pull model có thêm reverse proxy.

![Hình 12.26: Pull model có reverse proxy](../images/v2/chapter12/Figure_12.26.png)

Sau khi có reverse proxy, chúng ta có thể tăng tốc response bằng cách sửa read-only state machine. Như đã đề cập trước đó, read-only state machine có thể có behavior riêng. Ví dụ, một behavior có thể khiến read-only state machine push execution state ngược lại cho reverse proxy ngay sau khi nhận event. Điều này tạo cho user cảm giác response realtime.

Hình 12.27 minh họa push-based model.

![Hình 12.27: Push model](../images/v2/chapter12/Figure_12.27.png)

### Distributed transaction
Chúng ta có thể dùng lại distributed transaction solution, TC/C hoặc Saga. Giả sử chúng ta partition data bằng cách chia hash của key cho 2.

Hình 12.28 minh họa thiết kế đã update.

![Hình 12.28: Thiết kế cuối cùng](../images/v2/chapter12/Figure_12.28.png)

Hãy xem thao tác chuyển tiền hoạt động như thế nào trong kiến trúc distributed event sourcing cuối cùng. Để dễ hiểu hơn, chúng ta sử dụng Saga distributed transaction model và chỉ giải thích success path không rollback.

Thao tác chuyển tiền gồm 2 distributed operation: A:-$1 và C:+$1. Saga coordinator điều phối việc thực thi, như minh họa trong Hình 12.29:
1. User A gửi một distributed transaction đến Saga coordinator. Transaction này gồm hai operation: A:-$1 và C:+$1.
2. Saga coordinator tạo một record trong phase state table để theo dõi trạng thái transaction.
3. Saga coordinator kiểm tra thứ tự operation và xác định cần xử lý A:-$1 trước. Coordinator gửi A:-$1 dưới dạng command đến partition 1, nơi chứa thông tin tài khoản A.
4. Raft leader của partition 1 nhận command A:-$1 và lưu nó vào command list. Sau đó validate command. Nếu hợp lệ, nó chuyển command thành event. Raft consensus algorithm được dùng để đồng bộ data giữa các node khác nhau. Event (trừ $1 khỏi số dư tài khoản A) được thực thi sau khi đồng bộ hoàn tất.
5. Sau khi event được đồng bộ, event sourcing framework của partition 1 dùng CQRS để đồng bộ data sang read path. Read path xây dựng lại state và execution state.
6. Read path của partition 1 push state ngược về caller của event sourcing framework, tức Saga coordinator.
7. Saga coordinator nhận success state từ partition 1.
8. Saga coordinator tạo một record trong phase state table cho biết operation trong partition 1 đã thành công.
9. Vì operation đầu tiên thành công, Saga coordinator thực thi operation thứ hai là C:+$1. Coordinator gửi C:+$1 dưới dạng command đến partition 2, nơi chứa thông tin tài khoản C.
10. Raft leader của partition 2 nhận command C:+$1 và lưu nó vào command list. Nếu hợp lệ, nó chuyển command thành event. Raft consensus algorithm được dùng để đồng bộ data giữa các node khác nhau. Event (cộng $1 vào tài khoản C) được thực thi sau khi đồng bộ hoàn tất.
11. Sau khi event được đồng bộ, event sourcing framework của partition 2 dùng CQRS để đồng bộ data sang read path. Read path xây dựng lại state và execution state.
12. Read path của partition 2 push state ngược về caller của event sourcing framework, tức Saga coordinator.
13. Saga coordinator nhận success state từ partition 2.
14. Saga coordinator tạo một record trong phase state table cho biết operation trong partition 2 đã thành công.
15. Lúc này, mọi operation đều thành công và distributed transaction hoàn tất. Saga coordinator trả kết quả về caller.

![Hình 12.29: Trình tự được đánh số của thiết kế cuối cùng](../images/v2/chapter12/Figure_12.29.png)

# Bước 4 - Tóm tắt
Trong chương này, chúng ta đã thiết kế một wallet service có thể xử lý hơn 1 triệu payment command mỗi giây. Sau khi ước tính sơ bộ, chúng ta kết luận cần hàng nghìn node để hỗ trợ tải như vậy.

Trong thiết kế đầu tiên, chúng ta đề xuất giải pháp sử dụng in-memory key-value store như Redis. Vấn đề của thiết kế này là data không persistent.

Trong thiết kế thứ hai, in-memory cache được thay thế bằng transactional database. Để hỗ trợ nhiều node, nhiều distributed transaction protocol khác nhau như 2PC, TC/C và Saga đã được đề xuất. Vấn đề chính của transaction-based solution là không thể audit data dễ dàng.

Tiếp theo, chúng ta giới thiệu event sourcing. Ban đầu, chúng ta triển khai event sourcing bằng external database và queue, nhưng hiệu năng không tốt. Bằng cách lưu command, event và state trong local node, chúng ta đã cải thiện hiệu năng.

Single node có nghĩa là single point of failure. Để cải thiện độ tin cậy của hệ thống, chúng ta dùng Raft consensus algorithm để replicate event list trên nhiều node.

Tối ưu hóa cuối cùng là sử dụng đặc tính CQRS của event sourcing. Chúng ta cung cấp cho external user một read path bất đồng bộ. TC/C hoặc Saga protocol được dùng để điều phối việc thực thi command giữa nhiều node group.

Chúc mừng bạn đã kiên trì đến đây! Bây giờ hãy tự động viên mình một chút. Làm tốt lắm!

## Mục lục chương

![Hình summary: Mục lục chương](../images/v2/chapter12/Figure_summary.png)

## Tài liệu tham khảo

Tài liệu tham khảo  
[1] Transactional guarantees. https://docs.oracle.com/cd/E1727501/html/programmer_reference/rep_trans.html  
[2] TPC-E Top Price/Performance Results. http://tpc.org/tpce/results/tpce_priceperf_results5.asp?resulttype=all  
[3] ISO 4217 CURRENCY CODES. https://en.wikipedia.org/wiki/ISO4217  
[4] Apache ZooKeeper. https://zookeeper.apache.org/  
[5] Martin Kleppmann. Designing Data-Intensive Applications. O'Reilly Media, 2017  
[6] X/Open XA. https://en.wikipedia.org/wiki/X/Open_XA  
[7] Compensating transaction. https://en.wikipedia.org/wiki/Compensating_transaction  
[8] SAGAS, Hector Garcia-Molina. https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf  
[9] Eric Evans. Domain-Driven Design: Tackling Complexity in the Heart of Software. Addison-Wesley Professional, 2003  
[10] Apache Kafka. https://kafka.apache.org/  
[11] CQRS. https://martinfowler.com/bliki/CQRS.html  
[12] Comparing Random and Sequential Access in Disk and Memory. https://deliveryimages.acm.org/10.1145/1570000/1563874/jacobs3.jpg  
[13] mmap. https://man7.org/linux/man-pages/man2/mmap.2.html  
[14] SQLite. https://www.sqlite.org/index.html  
[15] RocksDB. https://rocksdb.org/  
[16] Apache Hadoop. https://hadoop.apache.org/  
[17] Raft. https://raft.github.io/  
[18] Reverse proxy. https://en.wikipedia.org/wiki/Reverseproxy
