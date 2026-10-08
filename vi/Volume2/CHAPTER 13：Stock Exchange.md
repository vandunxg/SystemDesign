# Chương 13: Sàn giao dịch chứng khoán

Trong chương này, chúng ta sẽ thiết kế một sàn giao dịch chứng khoán điện tử.

Chức năng cơ bản của sàn giao dịch là khớp lệnh bên mua và bên bán một cách hiệu quả. Chức năng cơ bản này chưa bao giờ thay đổi. Trước khi máy tính xuất hiện, con người khớp lệnh bằng cách trao đổi hàng hóa và hô giá. Ngày nay, các siêu máy tính âm thầm xử lý order; người ta giao dịch không chỉ để mua bán hàng hóa mà còn để đầu cơ và arbitrage. Công nghệ đã thay đổi mạnh mẽ cục diện giao dịch và giúp khối lượng giao dịch trên các thị trường điện tử tăng theo cấp số nhân.

Khi nói đến sàn giao dịch chứng khoán, hầu hết mọi người trước tiên nghĩ đến những tên tuổi lớn đã tồn tại hơn 50 năm như New York Stock Exchange (NYSE) hoặc Nasdaq (NASDAQ). Trên thực tế, còn có nhiều loại sàn giao dịch khác. Một số tập trung vào các phân khúc dọc trong ngành tài chính và đặc biệt nhấn mạnh vào công nghệ [1], trong khi một số khác lấy tính công bằng làm triết lý cốt lõi [2]. Trước khi đi sâu vào thiết kế, cần xác nhận với interviewer về quy mô và các đặc tính quan trọng của sàn giao dịch cần thiết kế.

Chỉ xét về quy mô: NYSE khớp hàng tỷ giao dịch mỗi ngày [3], còn Hong Kong Stock Exchange giao dịch khoảng 200 tỷ cổ phiếu mỗi ngày [4]. Hình 13.1 cho thấy các sàn giao dịch lớn trong “câu lạc bộ nghìn tỷ đô la”, được phân loại theo vốn hóa thị trường.

![Hình 13.1: Các sàn giao dịch chứng khoán lớn nhất (nguồn: [5])](../images/v2/chapter13/Figure13.1.png)

## Bước 1 - Hiểu vấn đề và xác định phạm vi thiết kế

Sàn giao dịch hiện đại là một hệ thống phức tạp với các yêu cầu nghiêm ngặt về latency, throughput và robustness. Trước khi bắt đầu, hãy đặt interviewer một số câu hỏi để làm rõ yêu cầu.

**Ứng viên**: Chúng ta sẽ giao dịch những loại chứng khoán nào? Cổ phiếu, options hay futures?  
**Interviewer**: Để đơn giản, chỉ có cổ phiếu.

**Ứng viên**: Hỗ trợ những thao tác order nào? Đặt order, hủy order hay sửa order? Cần hỗ trợ limit order, market order hay conditional order?  
**Interviewer**: Cần hỗ trợ các chức năng sau: đặt order mới và hủy order. Về loại order, chỉ xét limit order.

**Ứng viên**: Hệ thống có cần hỗ trợ giao dịch sau giờ không?  
**Interviewer**: Không, chỉ hỗ trợ giờ giao dịch thông thường.

**Ứng viên**: Có thể mô tả các chức năng cơ bản của sàn giao dịch không? Quy mô của sàn như thế nào, chẳng hạn có bao nhiêu người dùng, bao nhiêu sản phẩm giao dịch và bao nhiêu order?  
**Interviewer**: Khách hàng có thể gửi limit order mới hoặc hủy order, đồng thời nhận thông báo khớp lệnh theo thời gian thực. Khách hàng cũng có thể xem order book theo thời gian thực (danh sách các lệnh mua bán đang chờ). Sàn giao dịch cần hỗ trợ ít nhất hàng chục nghìn người dùng giao dịch đồng thời và ít nhất 100 sản phẩm giao dịch (symbol). Về khối lượng giao dịch, hệ thống cần hỗ trợ hàng tỷ order mỗi ngày. Ngoài ra, sàn giao dịch là một tổ chức chịu sự quản lý, nên phải bảo đảm thực hiện các kiểm tra risk control.

**Ứng viên**: Cụ thể yêu cầu của các kiểm tra risk control là gì?  
**Interviewer**: Chỉ cần kiểm tra risk control đơn giản. Ví dụ, khối lượng giao dịch của một người dùng đối với một cổ phiếu trong một ngày không được vượt quá 1 triệu cổ phiếu.

**Ứng viên**: Tôi nhận thấy anh/chị chưa đề cập đến việc quản lý wallet của người dùng. Đây có phải là phần chúng ta cần xem xét không?  
**Interviewer**: Câu hỏi hay! Chúng ta cần bảo đảm người dùng có đủ tiền khi đặt order. Nếu một order đang chờ khớp trong order book, số tiền cần cho order đó phải được khóa lại để ngăn việc chi tiêu vượt mức.

### Yêu cầu phi chức năng

Sau khi xác nhận các yêu cầu chức năng với interviewer, chúng ta cần xác định các yêu cầu phi chức năng. Thực tế, những yêu cầu như “ít nhất 100 sản phẩm giao dịch” và “hàng chục nghìn người dùng” cho thấy interviewer muốn chúng ta thiết kế một sàn giao dịch quy mô nhỏ đến vừa. Trên cơ sở đó, chúng ta cũng cần bảo đảm thiết kế có thể scale để hỗ trợ nhiều sản phẩm và người dùng hơn. Nhiều interviewer sẽ tập trung vào scalability như một hướng hỏi tiếp theo.

Dưới đây là danh sách các yêu cầu phi chức năng:

- **Availability**: ít nhất 99.99%. Availability cực kỳ quan trọng đối với sàn giao dịch. Chỉ vài giây downtime cũng có thể làm tổn hại danh tiếng.
- **Fault tolerance**: cần có khả năng chịu lỗi và cơ chế khôi phục nhanh để giảm ảnh hưởng của sự cố production.
- **Latency**: round-trip latency cần đạt mức mili-giây, đặc biệt phải chú ý đến p99 latency. Round-trip latency là thời gian từ khi market order đi vào sàn giao dịch đến khi kết quả execution được trả về. p99 latency cao liên tục sẽ tạo trải nghiệm rất tệ cho một số ít người dùng.
- **Security**: sàn giao dịch cần có account management system. Vì lý do pháp lý và compliance, sàn giao dịch phải thực hiện kiểm tra KYC (Know Your Customer) trước khi mở account mới để xác minh danh tính người dùng. Đối với các tài nguyên public như trang web chứa market data, cần phòng thủ trước distributed denial-of-service attack (DDoS) [6].

### Ước tính sơ bộ

Hãy thực hiện một số ước tính sơ bộ đơn giản để hiểu quy mô hệ thống:

- 100 sản phẩm giao dịch
- 1 tỷ order mỗi ngày
- Giờ giao dịch của NYSE là từ thứ Hai đến thứ Sáu, từ 9:30 sáng đến 4:00 chiều theo giờ miền Đông, tổng cộng 6.5 giờ.
- QPS = 1 tỷ / 6.5 / 3600 ≈ 43,000
- Peak QPS = 5 × QPS = 215,000. Khối lượng giao dịch cao hơn đáng kể lúc mở cửa và trước khi đóng cửa phiên buổi trưa.

## Bước 2 - Đề xuất thiết kế cấp cao và đạt được sự đồng thuận

Trước khi đi sâu vào thiết kế cấp cao, hãy giới thiệu ngắn gọn một số khái niệm và thuật ngữ cơ bản hữu ích cho việc thiết kế sàn giao dịch.

### Giới thiệu kiến thức nghiệp vụ

**Broker**

Hầu hết khách hàng retail giao dịch với sàn thông qua broker. Có thể bạn quen thuộc với các broker như Charles Schwab, Robinhood, E*Trade, Fidelity, v.v. Các broker này cung cấp cho người dùng retail giao diện thân thiện để đặt order và xem market data.

**Institutional Client**

Institutional client sử dụng phần mềm giao dịch chuyên nghiệp để giao dịch với khối lượng lớn. Các institutional client khác nhau có những nhu cầu khác nhau. Ví dụ, quỹ hưu trí hướng đến lợi nhuận ổn định và giao dịch với tần suất thấp, nhưng khối lượng mỗi lần giao dịch rất lớn, nên cần các chức năng như chia nhỏ order để giảm market impact của order lớn [7]. Trong khi đó, một số hedge fund tập trung vào market making kiếm lợi nhuận từ rebate phí giao dịch; họ cần khả năng giao dịch với latency thấp và rõ ràng không thể chỉ xem market data trên web hoặc mobile App như nhà đầu tư retail.

**Limit Order**

Limit order là order mua hoặc bán cổ phiếu ở một mức giá cố định. Order có thể không tìm được matching ngay hoặc chỉ được fill một phần.

**Market Order**

Market order không chỉ định giá và được execution ngay theo giá thị trường hiện tại. Market order bảo đảm được fill bằng cách đánh đổi chi phí. Cách này rất hữu ích trong một số thị trường biến động nhanh.

**Market Data Levels**

Thị trường cổ phiếu Mỹ có ba level báo giá: L1 (level 1), L2 (level 2) và L3 (level 3). L1 market data bao gồm bid tốt nhất, ask tốt nhất và quantity tương ứng (Hình 13.2). Bid là mức giá cao nhất mà bên mua sẵn sàng trả cho một cổ phiếu; ask là mức giá thấp nhất mà bên bán sẵn sàng bán cổ phiếu.

<div align="center">
  <figure>
    <img src="../images/v2/chapter13/Figure13.2.png" alt="Hình 13.2: L1 market data" width="50%">
    <figcaption><p>Hình 13.2: L1 market data</p></figcaption>
  </figure>
</div>


L2 bao gồm nhiều mức giá hơn L1 (Hình 13.3).

<div align="center">
  <figure>
    <img src="../images/v2/chapter13/Figure13.3.png" alt="Hình 13.3: L2 market data" width="50%">
    <figcaption><p>Hình 13.3: L2 market data</p></figcaption>
    </figure>
</div>
L3 hiển thị từng mức giá cùng với số lượng đang xếp hàng ở mức giá đó (Hình 13.4).

<div align="center">
  <figure>
    <img src="../images/v2/chapter13/Figure13.4.png" alt="Hình 13.4: L3 market data" width="70%">
    <figcaption><p>Hình 13.4: L3 market data</p></figcaption>
  </figure>
</div>

**Candlestick Chart**

Candlestick chart biểu diễn giá cổ phiếu trong một khoảng thời gian. Một candlestick điển hình được minh họa ở Hình 13.5. Candlestick chart hiển thị giá mở cửa, giá đóng cửa, giá cao nhất và giá thấp nhất trong một khoảng thời gian nhất định. Các khoảng thời gian phổ biến gồm 1 phút, 5 phút, 1 giờ, 1 ngày, 1 tuần và 1 tháng.

<div align="center">
  <figure>
    <img src="../images/v2/chapter13/Figure13.5.png" alt="Hình 13.5: Ví dụ về một candlestick" width="50%">
    <figcaption><p>Hình 13.5: Ví dụ về một candlestick</p></figcaption>
  </figure>
</div>

**FIX Protocol**

FIX protocol [8], viết tắt của Financial Information Exchange protocol, được thành lập vào năm 1991, là một communication protocol vendor-neutral dùng để trao đổi thông tin giao dịch chứng khoán. Dưới đây là ví dụ về một giao dịch chứng khoán được mã hóa bằng FIX [8]:

```
8=FIX.4.2 | 9=176 | 35=8 | 49=PHLX | 56=PERS | 52=20071123-05:30:00.000 | 11=ATOMNOCCC9990900 | 20=3 | 150=E | 39=E | 55=MSFT | 167=CS | 54=1 | 38=15 | 40=2 | 44=15 | 58=PHLX EQUITY TESTING | 59=0 | 47=C | 32=0 | 31=0 | 151=15 | 14=0 | 6=0 | 10=128 |
```

### Thiết kế cấp cao

Sau khi hiểu các khái niệm chính, hãy xem thiết kế cấp cao của hệ thống như trong Hình 13.6.

![Hình 13.6: Thiết kế cấp cao](../images/v2/chapter13/Figure13.6.png)

Hãy theo dõi đường đi của một order qua các component để hiểu các module phối hợp với nhau như thế nào.

Trước tiên, hãy đi hết **trade flow**. Đây là critical path có yêu cầu latency cực kỳ nghiêm ngặt, nên mọi bước trong flow đều phải hoàn thành nhanh chóng:

**Bước 1**: Client đặt order thông qua website hoặc mobile App của broker.

**Bước 2**: Broker gửi order đến sàn giao dịch.

**Bước 3**: Order đi vào sàn giao dịch thông qua client gateway. Client gateway đảm nhiệm các chức năng gác cổng cơ bản như input validation, rate limiting, authentication và data normalization, sau đó chuyển tiếp order cho order manager.

**Bước 4～5**: Order manager thực hiện risk check dựa trên các rule do risk manager thiết lập.

**Bước 6**: Sau khi vượt qua risk check, order manager xác minh wallet có đủ tiền để thực hiện order hay không.

**Bước 7～9**: Order được gửi đến matching engine. Khi tìm thấy matching, matching engine tạo một execution record cho mỗi bên mua và bán. Để bảo đảm kết quả matching có tính deterministic khi replay, cả order và execution record đều được sort trong sequencer (sequencer sẽ được giới thiệu chi tiết ở phần sau).

**Bước 10～14**: Kết quả execution được trả về client.

Tiếp theo, hãy theo dõi **market data flow**, tức đường đi của execution record từ matching engine qua data service đến broker.

**Bước M1**: Matching engine tạo execution flow (fills) khi hoàn tất matching và gửi flow này đến market data publisher.

**Bước M2**: Market data publisher xây dựng candlestick chart và order book (gọi chung là market data) dựa trên execution flow và order flow, sau đó gửi chúng đến data service.

**Bước M3**: Market data được lưu trong dedicated storage để phục vụ realtime analysis. Broker kết nối với data service để lấy market data kịp thời và chuyển tiếp cho khách hàng của mình.

Cuối cùng, hãy xem **reporting flow**.

**Bước R1～R2 (reporting flow)**: Reporting service thu thập tất cả report field cần thiết (như client_id, price, quantity, order_type, filled_quantity, remaining_quantity) từ order và execution record, sau đó ghi record đã tổng hợp vào database.

Lưu ý rằng trade flow (bước 1 đến 14) nằm trên critical path, còn market data flow và reporting flow không nằm trên critical path, vì vậy yêu cầu latency của ba flow này khác nhau.

Dưới đây là phần giải thích chi tiết từng flow.

**Chi tiết trade flow**

Trade flow nằm trên critical path của sàn giao dịch và mọi thứ phải được hoàn thành nhanh chóng. Trung tâm của flow là matching engine, hãy tìm hiểu về nó trước.

**Matching Engine**

Matching engine còn được gọi là cross engine. Dưới đây là các trách nhiệm chính của matching engine:

1. Duy trì order book cho từng sản phẩm giao dịch. Order book là danh sách các lệnh mua bán đang chờ của một sản phẩm giao dịch; cách xây dựng chi tiết sẽ được giới thiệu trong chương data model ở phần sau.
2. Match buy order và sell order. Một lần matching tạo ra hai execution record (tương ứng với bên mua và bên bán). Chức năng matching phải nhanh và chính xác.
3. Phân phối execution flow dưới dạng market data.

Implementation của matching engine có high availability phải có khả năng tạo kết quả matching theo thứ tự deterministic. Nói cách khác, với một sequence order đã biết làm input, khi sequence đó được replay, matching engine phải tạo ra cùng một sequence execution record (fill) làm output. Tính deterministic này là nền tảng để thực hiện high availability; chúng ta sẽ thảo luận chi tiết trong chương thiết kế chuyên sâu.

**Sequencer**

Sequencer là component then chốt giúp matching engine có tính deterministic. Nó gắn sequence number cho mỗi inbound order trước khi matching engine xử lý; đồng thời cũng gắn sequence number cho mỗi cặp execution record (fill) mà matching engine hoàn tất. Nói cách khác, sequencer gồm hai instance inbound và outbound, mỗi instance duy trì một sequence number độc lập. Sequence number do mỗi sequencer tạo ra phải tăng liên tục để có thể nhanh chóng phát hiện sequence number bị thiếu. Xem Hình 13.7.

<div align="center">    
    <figure>
        <img src="../images/v2/chapter13/Figure13.7.png" alt="Hình 13.7: Inbound và outbound sequencer" width="100%">
        <figcaption><p>Hình 13.7: Inbound và outbound sequencer</p></figcaption>
    </figure>
</div>

Việc gắn sequence number cho inbound order và outbound execution có các lý do sau:

1. Bảo đảm timeliness và fairness.
2. Hỗ trợ recovery và message replay nhanh.
3. Bảo đảm semantics “exactly-once”.

Sequencer không chỉ tạo sequence number mà còn đóng vai trò message queue: một sequencer gửi message (inbound order) đến matching engine, sequencer còn lại gửi message (execution record) về order manager. Nó đồng thời là event store của order và execution record. Cách này tương tự hai Kafka event stream kết nối với matching engine: một stream cho inbound order và một stream cho outbound execution record. Thực tế, nếu latency của Kafka thấp hơn và dễ dự đoán hơn, hoàn toàn có thể sử dụng Kafka. Chúng ta sẽ thảo luận cách implementation sequencer trong môi trường sàn giao dịch latency thấp ở chương thiết kế chuyên sâu.

**Order Manager**

Một đầu của order manager nhận order, đầu còn lại nhận execution result và chịu trách nhiệm quản lý trạng thái order. Hãy tìm hiểu kỹ hơn.

Order manager nhận inbound order từ client gateway và thực hiện các thao tác sau:

- Gửi order đi risk check. Yêu cầu risk control của chúng ta rất đơn giản, chẳng hạn xác minh khối lượng giao dịch trong ngày của người dùng có thấp hơn 1 triệu cổ phiếu hay không.
- Đối chiếu order với wallet của người dùng để xác nhận có đủ tiền thực hiện giao dịch. Nội dung về wallet đã được thảo luận chi tiết trong chương “Digital Wallet” (trang 341); có thể tham khảo chương đó để tìm hiểu implementation phù hợp cho sàn giao dịch.
- Gửi order đến sequencer để sequencer gắn sequence number, sau đó matching engine xử lý order. New order chứa nhiều attribute, nhưng không cần gửi tất cả attribute cho matching engine. Để giảm lượng data truyền tải, order manager chỉ truyền các attribute cần thiết.

Ở chiều ngược lại, order manager nhận execution record từ matching engine thông qua sequencer, rồi trả execution result của order đã fill về broker thông qua client gateway.

Order manager phải nhanh, hiệu quả và chính xác. Nó chịu trách nhiệm duy trì trạng thái hiện tại của order. Thực tế, quản lý nhiều state transition là nguồn gốc chính tạo nên độ phức tạp của order manager; trong hệ thống sàn giao dịch thực tế có thể có hàng chục nghìn tình huống state transition. Event sourcing [9] rất phù hợp để thiết kế order manager; chúng ta sẽ thảo luận thiết kế dựa trên event sourcing trong chương thiết kế chuyên sâu.

**Client Gateway**

Client gateway là cổng gác ở lối vào của sàn giao dịch, chịu trách nhiệm nhận order của client và route đến order manager. Gateway cung cấp các chức năng được minh họa trong Hình 13.8.

<div align="center">
    <figure>
        <img src="../images/v2/chapter13/Figure13.8.png" alt="Hình 13.8: Các component của client gateway" width="80%">
        <figcaption><p>Hình 13.8: Các component của client gateway</p></figcaption>
    </figure>
</div>

Client gateway nằm trên critical path và nhạy cảm với latency, nên cần được giữ lightweight. Nó phải chuyển tiếp order đến đúng destination nhanh nhất có thể. Dù các chức năng trên đều quan trọng, tất cả vẫn phải được thực hiện nhanh nhất có thể. Việc quyết định chức năng nào đặt trong client gateway và chức năng nào để matching engine cùng risk check đảm nhiệm là một trade-off trong thiết kế. Nguyên tắc chung là nên để các chức năng phức tạp cho matching engine và risk check.

Loại client gateway của khách hàng retail và institutional khác nhau; các yếu tố cần cân nhắc chính là latency, trading volume và yêu cầu security. Ví dụ, các institutional client như market maker cung cấp rất nhiều liquidity cho sàn giao dịch và có yêu cầu cực kỳ cao về latency. Hình 13.9 minh họa cách các client gateway khác nhau kết nối với sàn giao dịch. Một ví dụ cực đoan là colo engine: broker thuê server đặt trong data center của sàn để chạy trading engine software; latency về bản chất chính là thời gian truyền tín hiệu từ colo server đến server của sàn [10].

![Hình 13.9: Client gateway](../images/v2/chapter13/Figure13.9.png)

### Market data flow

Market data publisher (MDP) nhận execution record từ matching engine và xây dựng order book cùng candlestick chart dựa trên execution flow. Order book và candlestick chart được gọi chung là market data; chúng ta sẽ thảo luận chi tiết trong chương “Data Model” ở phần sau. Market data sau đó được gửi đến data service để data service cung cấp cho subscriber. Hình 13.10 minh họa một implementation của MDP và cách nó phối hợp với các component khác trong market data flow.

![Hình 13.10: Market data publisher](../images/v2/chapter13/Figure13.10.png)

### Reporting flow

Một component quan trọng của sàn giao dịch là reporting. Reporting service không nằm trên critical path của giao dịch nhưng vẫn là một phần then chốt của hệ thống. Nó chịu trách nhiệm về transaction history, tax report, compliance report, clearing và các tác vụ khác. Efficiency và latency rất quan trọng đối với trade flow, nhưng reporting service ít nhạy cảm với latency hơn; accuracy và compliance mới là các yếu tố cốt lõi của reporting service.

Cách làm thông thường là ghép các attribute từ inbound order và outbound execution record. Inbound new order chứa order detail, còn outbound execution record thường chỉ chứa order ID, price, quantity và execution status. Reporting service merge attribute từ hai nguồn để tạo report. Hình 13.11 minh họa cách các component phối hợp trong reporting flow.

![Hình 13.11: Reporting service](../images/v2/chapter13/Figure13.11.png)

Độc giả tinh ý có thể nhận thấy thứ tự các section trong “Bước 2 - Đề xuất thiết kế cấp cao và đạt được sự đồng thuận” của chương này hơi khác các chương khác. Trong chương này, phần API design và data model được đặt sau thiết kế cấp cao. Lý do là hai phần này cần dùng một số khái niệm được giới thiệu trong thiết kế cấp cao.

### Thiết kế API

Sau khi hiểu thiết kế cấp cao, hãy xem thiết kế API.

Client tương tác với sàn giao dịch chứng khoán thông qua broker để đặt order, truy vấn execution, lấy market data, tải historical data phục vụ phân tích và thực hiện các thao tác khác. Chúng ta dùng chuẩn RESTful để định nghĩa interface giữa broker và client gateway. Với các resource được đề cập dưới đây, hãy tham khảo chương “Data Model” (trang 393).

Cần lưu ý rằng RESTful API có thể không đáp ứng yêu cầu latency của institutional client như hedge fund. Phần mềm chuyên dụng được xây dựng cho các tổ chức này nhiều khả năng sẽ dùng protocol khác, nhưng bất kể sử dụng protocol nào, các chức năng cơ bản dưới đây đều cần được hỗ trợ.

**Đặt order**

```
POST /v1/order
```

Endpoint này dùng để đặt order và yêu cầu authentication.

Request parameter:

- `symbol`: mã cổ phiếu. String
- `side`: mua hoặc bán (buy/sell). String
- `price`: giá của limit order. Long
- `orderType`: limit order hoặc market order (thiết kế của chúng ta chỉ hỗ trợ limit order). String
- `quantity`: số lượng order. Long

Response field:

Body:
- `id`: order ID. Long
- `creationTime`: thời điểm order được tạo trong hệ thống. Long
- `filledQuantity`: quantity đã fill. Long
- `remainingQuantity`: quantity còn chờ fill. Long
- `status`: new / canceled / filled. String
- Các attribute còn lại giống request parameter.

Status code:
- 200: thành công
- 40x: parameter error / access denied / unauthorized
- 500: server error

**Truy vấn execution record**

```
GET /v1/execution?symbol={:symbol}&orderId={:orderId}&startTime={:startTime}&endTime={:endTime}
```

Endpoint này dùng để truy vấn execution information và yêu cầu authentication.

Request parameter:

- `symbol`: mã cổ phiếu. String
- `orderId`: order ID (tùy chọn). String
- `startTime`: thời điểm bắt đầu truy vấn (epoch timestamp) [11]. Long
- `endTime`: thời điểm kết thúc truy vấn (epoch timestamp). Long

Response field:

Body:
- `executions`: array execution record, mỗi execution gồm các attribute sau: Array
  - `id`: execution ID. Long
  - `orderId`: order ID liên quan. Long
  - `symbol`: mã cổ phiếu. String
  - `side`: mua hoặc bán. String
  - `price`: execution price. Long
  - `orderType`: limit order hoặc market order. String
  - `quantity`: execution quantity. Long

Status code:
- 200: thành công
- 40x: parameter error / not found / access denied / unauthorized
- 500: server error

**Truy vấn order book**

```
GET /v1/marketdata/orderBook/L2?symbol={:symbol}&depth={:depth}
```

Endpoint này dùng để truy vấn thông tin L2 order book của sản phẩm giao dịch và depth được chỉ định.

Request parameter:

- `symbol`: mã cổ phiếu. String
- `depth`: depth của order book ở mỗi phía. Int
- `startTime`: thời điểm bắt đầu truy vấn (epoch timestamp). Long
- `endTime`: thời điểm kết thúc truy vấn (epoch timestamp). Long

Response field:

Body:
- `bids`: array chứa price và quantity. Array
- `asks`: array chứa price và quantity. Array

Status code:
- 200: thành công
- 40x: parameter error / not found / access denied / unauthorized
- 500: server error

**Truy vấn historical price (candlestick chart)**

```
GET /v1/marketdata/candles?symbol={:symbol}&resolution={:resolution}&startTime={:startTime}&endTime={:endTime}
```

Endpoint này dùng để truy vấn dữ liệu candlestick chart của sản phẩm giao dịch được chỉ định trong khoảng thời gian và với resolution cho trước (xem candlestick chart trong chương data model).

Request parameter:

- `symbol`: mã cổ phiếu. String
- `resolution`: độ dài time window của candlestick (giây). Long
- `startTime`: thời điểm bắt đầu time window (epoch timestamp). Long
- `endTime`: thời điểm kết thúc time window (epoch timestamp). Long

Response field:

Body:
- `candles`: array candlestick data, mỗi candlestick gồm các attribute sau: Array
  - `open`: giá mở cửa. Double
  - `close`: giá đóng cửa. Double
  - `high`: giá cao nhất. Double
  - `low`: giá thấp nhất. Double

Status code:
- 200: thành công
- 40x: parameter error / not found / access denied / unauthorized
- 500: server error

### Data model

Sàn giao dịch có ba loại data chính, hãy lần lượt tìm hiểu:

- Product, Order, Execution
- Order Book
- Candlestick Chart

**Product, Order và Execution**

Product mô tả các attribute của một sản phẩm giao dịch, chẳng hạn product type, trading code, UI display code, settlement currency, lot size, tick size và các thuộc tính khác. Loại data này thay đổi với tần suất rất thấp và chủ yếu được dùng để hiển thị trên UI. Nó có thể được lưu trong bất kỳ database nào và rất cache-friendly.

Order đại diện cho một instruction inbound để mua hoặc bán. Execution đại diện cho kết quả output sau matching, còn được gọi là fill. Không phải order nào cũng tạo ra execution. Output của matching engine chứa hai execution record, tương ứng với bên mua và bên bán của order đã được match.

Hình 13.12 minh họa logical model diagram về mối quan hệ giữa ba entity; lưu ý đây không phải database schema.

![Hình 13.12: Product, Order và Execution](../images/v2/chapter13/Figure13.12.png)

Order và execution record là những data quan trọng nhất trong sàn giao dịch. Cả ba flow được đề cập trong thiết kế cấp cao đều sử dụng chúng, nhưng dưới các hình thức hơi khác nhau.

- Trên critical trade path, order và execution record không được lưu trong database. Để đạt performance cao, path này thực hiện giao dịch trong memory và sử dụng disk hoặc shared memory để persist và share order cùng execution record. Cụ thể, order và execution record được lưu trong sequencer để hỗ trợ recovery nhanh; data được archive sau khi thị trường đóng cửa. Chúng ta sẽ thảo luận implementation hiệu quả của sequencer trong chương thiết kế chuyên sâu.
- Reporting service ghi order và execution record vào database để phục vụ các trường hợp như reconciliation và tax report.
- Execution record được chuyển tiếp đến market data processor để rebuild order book và candlestick chart; hai loại data này sẽ được giới thiệu dưới đây.

**Order Book**

Order book là danh sách các lệnh mua bán đang chờ của một security hoặc financial instrument cụ thể, được tổ chức theo các price level [12][13]. Đây là data structure cốt lõi dùng để matching order nhanh trong matching engine. Một order book data structure hiệu quả cần đáp ứng các yêu cầu sau:

- **Lookup trong constant time**: các thao tác gồm lấy tổng quantity ở một price level hoặc trong một khoảng giá.
- **Add/cancel/fill nhanh**: time complexity lý tưởng là O(1). Các thao tác gồm đặt order mới, hủy order và matching execution.
- **Update nhanh**: thao tác gồm replace order.
- **Truy vấn best bid/ask**.
- **Duyệt qua các price level**.

Ví dụ trong Hình 13.13 dưới đây minh họa từng bước quá trình fill của order book.

![Hình 13.13: Minh họa limit order book](../images/v2/chapter13/Figure13.13.png)

Trong ví dụ trên, một market buy order lớn mua 2700 cổ phiếu Apple. Buy order này lấy hết các sell order trong queue của best ask và lấy sell order đầu tiên trong queue ở mức giá 100.11. Sau khi order lớn này được fill, bid-ask spread mở rộng và giá tăng một tick (khi đó best ask trở thành 100.11).

Đoạn code dưới đây minh họa một cách implementation order book.

```
class PriceLevel {
    private Price limitPrice;
    private long totalVolume;
    private List<Order> orders;
}

class Book<Side> {
    private Side side;
    private Map<Price, PriceLevel> limitMap;
}

class OrderBook {
    private Book<Buy> buyBook;
    private Book<Sell> sellBook;
    private PriceLevel bestBid;
    private PriceLevel bestOffer;
    private Map<OrderID, Order> orderMap;
}
```

Đoạn code này có đáp ứng tất cả yêu cầu thiết kế nêu trên không? Ví dụ, khi add/cancel limit order, time complexity có phải O(1) không? Câu trả lời là không, vì ở đây sử dụng list thông thường (`private List<Order> orders`). Để có order book hiệu quả hơn, cần đổi data structure của “orders” thành **doubly linked list**, nhờ đó các thao tác delete (cancel và fill) cũng đạt time complexity O(1). Dưới đây là cách implementation time complexity O(1) cho ba thao tác này:

1. **Đặt order mới**: append order mới vào cuối PriceLevel. Với doubly linked list, thao tác này có time complexity O(1).
2. **Fill**: xóa một order ở đầu PriceLevel. Với doubly linked list, thao tác này có time complexity O(1).
3. **Hủy order**: xóa một order khỏi OrderBook. Chúng ta sử dụng auxiliary data structure `Map<OrderID, Order> orderMap` trong OrderBook để locate order cần hủy trong O(1). Sau khi tìm thấy order, nếu list “orders” là singly linked list, code vẫn phải duyệt toàn bộ list để tìm pointer đến node trước đó rồi mới xóa được, việc này tốn O(n). Vì hiện tại là doubly linked list, bản thân order giữ pointer đến order trước đó, nên có thể xóa mà không cần duyệt toàn bộ list.

Hình 13.14 minh họa cách ba thao tác này hoạt động.

![Hình 13.14: Đặt order, fill và cancel với time complexity O(1)](../images/v2/chapter13/Figure13.14.png)

Để biết thêm chi tiết, hãy tham khảo tài liệu [14].

Đáng chú ý là order book data structure cũng được sử dụng rộng rãi trong market data processor để rebuild L1, L2 và L3 data dựa trên execution flow do matching engine tạo ra.

**Candlestick Chart**

Candlestick chart là một data structure quan trọng khác trong market data processor (song song với order book), dùng để tạo market data.

Chúng ta model bằng class Candlestick và class CandlestickChart. Khi time interval của một candlestick kết thúc, một instance Candlestick mới được tạo cho time interval tiếp theo và append vào linked list của instance CandlestickChart.

```
class Candlestick {
    private long openPrice;
    private long closePrice;
    private long highPrice;
    private long lowPrice;
    private long volume;
    private long timestamp;
    private int interval;
}

class CandlestickChart {
    private LinkedList<Candlestick> sticks;
}
```

Việc theo dõi lịch sử giá candlestick của nhiều sản phẩm giao dịch và nhiều time interval tiêu tốn rất nhiều memory. Tối ưu thế nào? Có hai cách sau:

1. Dùng preallocated ring buffer để lưu candlestick data, giảm số lần tạo object.
2. Giới hạn số lượng candlestick được giữ trong memory và persist phần data còn lại xuống disk.

Chúng ta sẽ giới thiệu chi tiết các cách tối ưu này trong phần “Market Data Publisher” của chương thiết kế chuyên sâu (trang 409).

Market data thường được persist trong in-memory columnar database (ví dụ KDB [15]) để phục vụ realtime analysis. Sau khi đóng cửa, data được persist vào historical database.

## Bước 3 - Thiết kế chuyên sâu

Sau khi hiểu cách vận hành cấp cao của sàn giao dịch, hãy tìm hiểu cách các sàn giao dịch hiện đại phát triển đến ngày nay. Sàn giao dịch hiện đại thực sự trông như thế nào? Câu trả lời có thể khiến nhiều độc giả bất ngờ: một số sàn giao dịch lớn chạy gần như tất cả component trên một server lớn, thậm chí toàn bộ trong một process. Điều này nghe có vẻ cực đoan, nhưng chúng ta có thể học được nhiều kinh nghiệm quý giá từ đó.

Hãy đi sâu vào vấn đề.

### Tối ưu performance

Như đã nêu trong yêu cầu phi chức năng, latency cực kỳ quan trọng đối với sàn giao dịch. Không chỉ average latency phải thấp, toàn bộ latency cũng phải ổn định. Một chỉ số tốt để đo mức độ ổn định là p99 latency.

Latency có thể được phân rã thành các thành phần theo công thức sau:

**Latency = tổng thời gian execution của các task trên critical path**

Có hai cách giảm latency:

1. Giảm số lượng task trên critical path.
2. Rút ngắn thời gian execution của từng task:
   - Giảm hoặc loại bỏ việc sử dụng network và disk
   - Giảm thời gian execution của chính từng task

Trước tiên hãy xem cách thứ nhất. Như thiết kế cấp cao cho thấy, critical trade path bao gồm:

**Gateway → Order Manager → Sequencer → Matching Engine**

Chỉ giữ các component cần thiết trên critical path; thậm chí log cũng được loại khỏi critical path để đạt latency thấp nhất.

Tiếp theo là cách thứ hai. Trong thiết kế cấp cao, các component trên critical path chạy trên các server độc lập được kết nối qua network. Một round-trip network latency đơn lẻ khoảng 500 microsecond. Khi nhiều component giao tiếp qua network, tổng network latency tích lũy có thể đạt vài mili-giây. Ngoài ra, sequencer là event store persist event xuống disk; ngay cả một implementation hiệu quả tận dụng ưu thế của sequential write, disk access latency vẫn lên đến hàng chục mili-giây. Về network và disk access latency, có thể tham khảo “Latency Numbers Every Programmer Should Know” [16].

Kết hợp network và disk access latency, tổng end-to-end latency có thể đạt hàng chục mili-giây. Con số này có thể chấp nhận được trong giai đoạn đầu phát triển của sàn giao dịch, nhưng khi các sàn cạnh tranh để đạt ultra-low latency, mức này là hoàn toàn không đủ.

Để duy trì lợi thế cạnh tranh, theo thời gian các sàn giao dịch liên tục cải tiến thiết kế bằng cách tìm cách giảm hoặc loại bỏ network và disk access latency, đưa end-to-end latency trên critical path xuống hàng chục microsecond. Một thiết kế đã được kiểm chứng trong thực tế là deploy tất cả component trên cùng một server để loại bỏ network hop. Khi mọi component ở trên cùng một server, chúng có thể giao tiếp thông qua mmap [17] dưới vai trò event store (sẽ được giải thích sau).

Hình 13.15 minh họa thiết kế sàn giao dịch latency thấp với tất cả component được deploy trên một server:

![Hình 13.15: Thiết kế sàn giao dịch latency thấp trên một server](../images/v2/chapter13/Figure13.15.png)

Có một số quyết định thiết kế thú vị đáng tìm hiểu sâu hơn.

Trước tiên hãy chú ý đến **application loop** trong hình trên. Application loop là một khái niệm thú vị: nó liên tục poll task cần thực hiện trong một vòng while và là cơ chế thực thi task chính. Để đáp ứng yêu cầu latency nghiêm ngặt, application loop chỉ xử lý các task quan trọng nhất. Mục tiêu là giảm thời gian execution của từng component và bảo đảm thời gian execution có tính dự đoán cao (tức p99 latency thấp). Mỗi box trong hình đại diện cho một component, component là một process trên server. Để tối đa hóa CPU efficiency, mỗi application loop (tức main processing loop) là single-threaded và thread được bind vào một CPU core cố định. Lấy order manager làm ví dụ, cấu trúc của nó được minh họa trong Hình 13.16.

![Hình 13.16: Application loop thread trong order manager](../images/v2/chapter13/Figure13.16.png)

Trong hình này, application loop của order manager được bind vào CPU 1. Việc bind application loop vào CPU có các lợi ích rất rõ ràng:

1. **Không context switch** [18]: CPU 1 được phân bổ hoàn toàn cho application loop của order manager.
2. **Không lock, do đó không lock contention**: vì chỉ có một thread update state.

Hai điểm này đều giúp đạt p99 latency thấp.

Trade-off của CPU binding là khiến việc coding phức tạp hơn. Engineer cần phân tích cẩn thận execution time của từng task, tránh để một task chiếm application loop thread quá lâu và chặn các task phía sau.

Tiếp theo, hãy tập trung vào hình chữ nhật dài ở giữa Hình 13.15 có nhãn “mmap”. “mmap” là một UNIX system call tuân theo chuẩn POSIX là `mmap(2)`, dùng để map file trên disk vào memory space của process.

`mmap(2)` cung cấp cơ chế high-performance để share memory giữa các process. Khi underlying file nằm trong thư mục `/dev/shm`, lợi thế performance còn rõ rệt hơn. `/dev/shm` là một memory-backed file system; khi thực hiện `mmap(2)` trên file trong `/dev/shm`, việc truy cập shared memory hoàn toàn không tạo ra disk I/O nào.

Các sàn giao dịch hiện đại tận dụng đặc tính này để loại bỏ disk access khỏi critical path càng nhiều càng tốt. Trong server, `mmap(2)` được dùng để xây dựng message bus, các component trên critical path giao tiếp qua bus này. Communication path này hoàn toàn không có network hoặc disk access; gửi một message trên mmap message bus chỉ mất thời gian ở mức sub-microsecond. Bằng cách dùng mmap để xây dựng event store, kết hợp với event sourcing design paradigm sẽ thảo luận tiếp theo, các sàn giao dịch hiện đại có thể xây dựng microservice latency thấp trong một server duy nhất.

### Event Sourcing

Chúng ta đã thảo luận event sourcing trong chương “Digital Wallet” (trang 341); hãy tham khảo chương đó để tìm hiểu sâu hơn về event sourcing.

Khái niệm event sourcing không khó hiểu. Trong application truyền thống, state được persist trong database. Khi có vấn đề xảy ra, rất khó truy nguyên root cause vì database chỉ lưu current state mà không ghi lại các event dẫn đến current state.

Trong event sourcing pattern, thay vì lưu current state, ta lưu một immutable log gồm tất cả event thay đổi state. Các event này là single source of truth (golden source of truth) của state thực tế. Hình 13.17 minh họa sự khác nhau giữa hai cách.

![Hình 13.17: So sánh non-event sourcing và event sourcing](../images/v2/chapter13/Figure13.17.png)

- Hình bên trái: database schema truyền thống ghi lại state của order nhưng không chứa thông tin order đã đi đến current state như thế nào.
- Hình bên phải: implementation tương ứng của event sourcing. Nó track tất cả event thay đổi state của order và có thể khôi phục order state bằng cách replay lần lượt toàn bộ event.

Hình 13.18 minh họa event sourcing design dùng mmap event store làm message bus. Cách này rất giống mô hình publish-subscribe (Pub-Sub) trong Kafka. Thực tế, nếu không có yêu cầu latency nghiêm ngặt, có thể dùng Kafka trực tiếp.

![Hình 13.18: Event sourcing design](../images/v2/chapter13/Figure13.18.png)

Trong hình này, external domain giao tiếp với trading domain thông qua FIX protocol được giới thiệu trong phần “Giới thiệu kiến thức nghiệp vụ” (trang 382).

- Gateway chuyển FIX thành “FIX over Simple Binary Encoding” (FIX over Simple Binary Encoding, SBE) để encoding nhanh và compact, rồi gửi từng order dưới dạng NewOrderEvent qua event store client theo format được định nghĩa trước (xem event store entry trong hình).
- Order manager (được embed trong matching engine) nhận NewOrderEvent từ event store, validate event, thêm event vào internal order state, sau đó gửi order đến matching core.
- Nếu order được fill, hệ thống tạo OrderFilledEvent và gửi vào event store.
- Các component khác (như market data publisher và reporting service) subscribe event store và xử lý theo cách tương ứng.

Thiết kế này tương ứng chặt chẽ với thiết kế cấp cao, nhưng có một số điều chỉnh để chạy hiệu quả hơn dưới event sourcing paradigm.

Khác biệt đầu tiên nằm ở **order manager**. Order manager trở thành một reusable library được embed trong các component khác nhau. Thiết kế này hợp lý trong bối cảnh này vì order state quan trọng đối với nhiều component. Nếu thiết lập một order manager tập trung để các component khác update hoặc query order state, latency sẽ tăng, đặc biệt đối với các component không nằm trên critical trade path (như reporting service trong hình). Dù mỗi component duy trì order state riêng, event sourcing bảo đảm các state này hoàn toàn consistent và có thể replay.

Một khác biệt quan trọng khác là **sequencer biến mất**. Nó đã đi đâu?

Trong event sourcing design, mọi message dùng chung một event store. Lưu ý event store entry chứa một field `sequence`, field này do sequencer inject.

Mỗi event store chỉ có một sequencer. Đặt nhiều sequencer là cách làm không tốt vì chúng sẽ tranh quyền ghi vào event store. Trong một hệ thống bận rộn như sàn giao dịch, rất nhiều thời gian sẽ bị lãng phí vì lock contention. Vì vậy, sequencer là một **single writer**, gắn sequence number cho event trước khi gửi event vào event store. Không giống sequencer trong thiết kế cấp cao đồng thời đóng vai trò message store, sequencer ở đây chỉ làm một việc đơn giản nên có tốc độ cực nhanh. Hình 13.19 minh họa một thiết kế sequencer trong môi trường memory-mapped.

Sequencer pull event từ các ring buffer local của từng component, gắn sequence number cho mỗi event rồi gửi vào event store. Để đạt high availability, có thể thiết lập một standby sequencer để ứng phó khi primary sequencer down.

![Hình 13.19: Ví dụ thiết kế sequencer](../images/v2/chapter13/Figure13.19.png)

### High Availability

Về high availability, mục tiêu thiết kế của chúng ta là đạt 4 số 9 (99.99%) availability. Điều này có nghĩa sàn giao dịch chỉ được downtime 8.64 giây mỗi ngày; khi service down, cần gần như khôi phục ngay lập tức.

Để đạt high availability, cần cân nhắc hai điểm sau:

- Trước tiên, xác định single point of failure trong kiến trúc sàn giao dịch. Ví dụ, matching engine down sẽ là thảm họa đối với sàn giao dịch, nên cần đặt redundant instance bên cạnh primary instance.
- Thứ hai, việc detect failure và quyết định failover sang standby instance phải hoàn tất nhanh chóng.

Đối với stateless service (như client gateway), có thể dễ dàng đạt high availability bằng horizontal scaling (tăng số server). Đối với stateful component (như order manager và matching engine), cần có khả năng replicate state data giữa các replica.

Hình 13.20 minh họa một data replication scheme. Hot-standby matching engine là primary instance; warm-standby engine nhận và xử lý chính xác cùng các event nhưng không publish outbound event nào vào event store. Khi primary instance down, warm-standby instance có thể lập tức tiếp quản làm primary instance mới và bắt đầu publish event. Khi warm-standby instance down rồi khởi động lại, nó có thể khôi phục toàn bộ state từ event store. Event sourcing rất phù hợp với kiến trúc sàn giao dịch; tính deterministic vốn có giúp việc khôi phục state trở nên đơn giản và chính xác.

![Hình 13.20: Hot-standby và warm-standby matching engine](../images/v2/chapter13/Figure13.20.png)

Chúng ta cũng cần thiết kế cơ chế detect vấn đề tiềm ẩn ở primary instance. Ngoài việc monitor hardware và process như thông thường, có thể cho matching engine gửi heartbeat packet. Nếu không nhận được heartbeat packet trong khoảng thời gian quy định, ta coi matching engine có thể đang gặp vấn đề.

Hạn chế của thiết kế hot-standby và warm-standby này là nó chỉ có hiệu lực trong phạm vi một server. Để đạt availability cao hơn, cần mở rộng khái niệm này ra nhiều machine hoặc thậm chí nhiều data center. Trong thiết lập đó, cả server sẽ là hot-standby hoặc warm-standby, và toàn bộ event store cần được replicate từ hot-standby server đến tất cả warm-standby replica. Replicate toàn bộ event store giữa các machine cần một khoảng thời gian; có thể dùng **reliable UDP** [19] để broadcast event message hiệu quả đến mọi warm-standby server. Có thể tham khảo thiết kế của Aeron [20] làm ví dụ.

Phần tiếp theo sẽ thảo luận cải tiến đối với thiết kế hot-standby và warm-standby để đạt availability cao hơn.

### Fault Tolerance

Thiết kế hot-standby và warm-standby nêu trên tương đối đơn giản và hoạt động khá tốt. Nhưng nếu warm-standby instance cũng gặp failure thì sao? Đây là sự kiện có xác suất thấp nhưng hậu quả nghiêm trọng, vì vậy chúng ta phải chuẩn bị để ứng phó.

Đây là vấn đề mà các công ty công nghệ lớn đều phải đối mặt. Giải pháp của họ là replicate core data đến các data center ở nhiều thành phố để chống lại thiên tai như động đất hoặc mất điện quy mô lớn. Để hệ thống có fault tolerance, cần trả lời các câu hỏi sau:

1. Nếu primary instance down, làm thế nào và khi nào quyết định chuyển sang standby instance?
2. Làm thế nào bầu ra leader trong các standby instance?
3. Cần thời gian khôi phục bao lâu (RTO - Recovery Time Objective)?
4. Những chức năng nào cần được khôi phục (RPO - Recovery Point Objective)? Hệ thống có thể chạy ở degraded state không?

Hãy lần lượt trả lời các câu hỏi này.

Trước hết, cần hiểu ý nghĩa thực sự của “down”, điều này không đơn giản như vẻ ngoài. Hãy xem xét các tình huống sau:

1. Hệ thống có thể phát sinh false positive, dẫn đến failover không cần thiết.
2. Bug trong code có thể làm primary instance down. Bug tương tự cũng có thể làm standby instance sập sau failover. Khi tất cả standby instance đều bị bug đó đánh sập, hệ thống sẽ không còn available.

Đây đều là những vấn đề khó giải quyết. Dưới đây là một số đề xuất: khi release system mới lần đầu, có thể cần thực hiện failover thủ công. Chỉ nên dần tự động hóa quy trình failure detection sau khi đã tích lũy đủ signal và kinh nghiệm vận hành, đồng thời xây dựng đủ confidence vào hệ thống. Chaos engineering [21] là một practice tốt để nhanh chóng phát hiện edge case và tích lũy kinh nghiệm vận hành.

Sau khi đưa ra quyết định failover chính xác, làm thế nào xác định server nào sẽ tiếp quản? May mắn là đây là một vấn đề đã được nghiên cứu kỹ, với nhiều leader election algorithm đã được kiểm chứng trong thực tế. Chúng ta lấy Raft [22] làm ví dụ.

Hình 13.21 minh họa một Raft cluster gồm 5 server, mỗi server có event store riêng. Leader hiện tại gửi data đến mọi instance khác (Follower). Trong Raft, số vote tối thiểu cần để thực hiện operation là ⌊n/2⌋+1, trong đó n là số member của cluster. Trong ví dụ này, tối thiểu cần ⌊5/2⌋+1 = 3 vote.

![Hình 13.21: Event replication trong Raft cluster](../images/v2/chapter13/Figure13.21.png)

Dưới đây là phần giới thiệu ngắn gọn về quá trình leader election. Leader gửi heartbeat message đến Follower (AppendEntries không có nội dung như trong Hình 13.21). Nếu một Follower không nhận được heartbeat message trong một khoảng thời gian, election timeout được trigger và Follower đó khởi động election mới. Follower đầu tiên trigger election timeout trở thành candidate và request vote (RequestVote) từ các Follower còn lại. Nếu Follower đó nhận được majority vote, nó trở thành Leader mới. Nếu term value của một Follower thấp hơn node mới, nó không thể trở thành Leader. Nếu nhiều Follower đồng thời trở thành candidate, tình huống này được gọi là “split vote”; khi đó election timeout và election được khởi động lại. Hình 13.22 giải thích “term”: trong Raft, thời gian được chia thành các interval có độ dài tùy ý, lần lượt đại diện cho normal operation period và election period.

![Hình 13.22: Raft term (nguồn: [23])](../images/v2/chapter13/Figure13.22.png)

Tiếp theo hãy xem **recovery time**. Recovery Time Objective (RTO) là thời gian tối đa application có thể down mà không gây thiệt hại nghiêm trọng cho business. Đối với sàn giao dịch chứng khoán, cần đạt RTO ở mức giây; điều này yêu cầu rõ ràng phải có automatic failover. Để làm vậy, cần phân loại service theo priority và xây dựng degradation strategy để duy trì mức service tối thiểu.

Cuối cùng, cần xác định **lượng data có thể chấp nhận mất**. Recovery Point Objective (RPO) là lượng data tối đa có thể mất trước khi gây thiệt hại nghiêm trọng cho business, tức loss tolerance. Trong thực tế, điều này có nghĩa cần backup data thường xuyên. Đối với sàn giao dịch chứng khoán, data loss hoàn toàn không thể chấp nhận, nên RPO gần bằng 0. Với Raft, chúng ta có nhiều replica của data; Raft bảo đảm state consensus giữa các cluster node. Nếu Leader hiện tại down, Leader mới phải có khả năng hoạt động bình thường ngay lập tức.

### Matching Algorithm

Hãy chuyển sang tìm hiểu sâu hơn về matching algorithm. Pseudocode dưới đây mô tả matching ở mức high-level.

```
Context handleOrder(OrderBook orderBook, OrderEvent orderEvent) {
    if (orderEvent.getSequenceId() != nextSequence) {
        return Error(OUT_OF_ORDER, nextSequence);
    }

    if (!validateOrder(symbol, price, quantity)) {
        return ERROR(INVALID_ORDER, orderEvent);
    }

    Order order = createOrderFromEvent(orderEvent);
    switch (msgType):
        case NEW:
            return handleNew(orderBook, order);
        case CANCEL:
            return handleCancel(orderBook, order);
        default:
            return ERROR(INVALID_MSG_TYPE, msgType);
}

Context handleNew(OrderBook orderBook, Order order) {
    if (BUY.equals(order.side)) {
        return match(orderBook.sellBook, order);
    } else {
        return match(orderBook.buyBook, order);
    }
}

Context handleCancel(OrderBook orderBook, Order order) {
    if (!orderBook.orderMap.contains(order.orderId)) {
        return ERROR(CANNOT_CANCEL_ALREADY_MATCHED, order);
    }

    removeOrder(order);
    setOrderStatus(order, CANCELED);
    return SUCCESS(CANCEL_SUCCESS, order);
}

Context match(OrderBook book, Order order) {
    Quantity leavesQuantity = order.quantity - order.matchedQuantity;
    Iterator<Order> limitIter = book.limitMap.get(order.price).orders;
    while (limitIter.hasNext() && leavesQuantity > 0) {
        Quantity matched = min(limitIter.next.quantity, order.quantity);
        order.matchedQuantity += matched;
        leavesQuantity = order.quantity - order.matchedQuantity;
        remove(limitIter.next);
        generateMatchedFill();
    }
    return SUCCESS(MATCH_SUCCESS, order);
}
```

Pseudocode này sử dụng **FIFO (First In, First Out)** matching algorithm. Ở cùng một price level, order đến trước được fill trước, order đến sau được fill sau.

Có nhiều matching algorithm khác nhau và các algorithm này được sử dụng rộng rãi trong futures trading. Ví dụ, FIFO algorithm có LMM (Lead Market Maker) sẽ phân bổ một tỷ lệ fill nhất định cho LMM trước queue FIFO thông thường theo tỷ lệ định sẵn; công ty LMM cần đàm phán với sàn giao dịch để có đặc quyền này. Có thể xem thêm matching algorithm được hỗ trợ trên website CME [24]. Matching algorithm cũng được sử dụng trong nhiều bối cảnh khác; một ví dụ điển hình là dark pool [25].

### Determinism

Determinism được chia thành **functional determinism** và **latency determinism**.

Functional determinism đã được giới thiệu ở các phần trước. Những lựa chọn thiết kế của chúng ta, như sequencer và event sourcing, bảo đảm kết quả luôn giống nhau nếu replay event theo cùng một thứ tự.

Trong functional determinism, thời điểm event thực sự xảy ra thường không quan trọng; thứ tự event mới quan trọng. Trong Hình 13.23, các timestamp event rời rạc và phân bố không đều theo chiều thời gian được chuyển thành các điểm liên tiếp, nhờ đó rút ngắn đáng kể thời gian replay/recovery.

![Hình 13.23: Time trong event sourcing](../images/v2/chapter13/Figure13.23.png)

**Latency determinism** nghĩa là latency của mỗi giao dịch trong hệ thống gần như giống nhau. Điều này quan trọng đối với business và có thể được đo bằng toán học: p99 latency, thậm chí nghiêm ngặt hơn là p99.99 latency. Có thể dùng HdrHistogram [26] để tính latency. Nếu p99 latency thấp, điều đó cho thấy sàn giao dịch cung cấp performance ổn định cho gần như mọi giao dịch.

Việc điều tra nguyên nhân gây ra latency fluctuation lớn là rất quan trọng. Ví dụ trong Java, safe point thường là nguyên nhân chính; Stop-the-World garbage collection của HotSpot JVM [27] là một ví dụ điển hình.

Đến đây, chúng ta đã hoàn tất phân tích chuyên sâu về critical trade path. Trong phần còn lại của chương, hãy tiếp tục tìm hiểu một số chi tiết thú vị ở các phần khác của sàn giao dịch.

### Tối ưu market data publisher

Như có thể thấy từ matching algorithm, L3 order book data giúp chúng ta hiểu sâu hơn về thị trường. Có thể lấy miễn phí dữ liệu candlestick một ngày từ Google Finance, nhưng lấy L2/L3 order book data chi tiết hơn thì rất tốn kém. Nhiều hedge fund tự ghi data thông qua realtime API của sàn giao dịch để xây dựng candlestick chart và các chart khác phục vụ technical analysis.

Market data publisher (MDP) nhận execution result từ matching engine, rebuild order book và candlestick chart dựa trên result đó, rồi publish data cho subscriber.

Quy trình rebuild order book tương tự pseudocode được đề cập trong phần matching algorithm ở trên. MDP là một service có nhiều level; chẳng hạn, mặc định retail client chỉ được xem 5 level L2 data và phải trả phí mới xem được 10 level. Memory của MDP không thể mở rộng vô hạn, nên cần giới hạn số lượng candlestick data. Để ôn lại candlestick chart, hãy tham khảo chương data model. Thiết kế MDP được minh họa trong Hình 13.24.

![Hình 13.24: Market data publisher](../images/v2/chapter13/Figure13.24.png)

Thiết kế này sử dụng **ring buffer**. Ring buffer, còn gọi là circular buffer, là một queue có kích thước cố định với head và tail nối với nhau. Producer liên tục tạo data, một hoặc nhiều consumer lấy data ra. Không gian của ring buffer được preallocate, không cần tạo hoặc giải phóng object; data structure này cũng lock-free. Có các kỹ thuật khác giúp data structure này hiệu quả hơn, chẳng hạn **padding**: bảo đảm sequence number của ring buffer không bao giờ share cùng một cache line với data khác, qua đó tránh false sharing. Để biết thêm chi tiết, hãy tham khảo [28].

### Fairness và multicast trong market data distribution

Trong giao dịch cổ phiếu, có latency thấp hơn người khác cũng giống như sở hữu một oracle có thể nhìn thấy tương lai. Đối với sàn giao dịch chịu sự quản lý, việc bảo đảm mọi market data receiver nhận data đồng thời là cực kỳ quan trọng. Tại sao điều này quan trọng? Ví dụ, MDP duy trì một danh sách subscriber; thứ tự subscriber được quyết định bởi thứ tự họ kết nối với publisher, subscriber kết nối đầu tiên luôn nhận data đầu tiên. Điều gì sẽ xảy ra? Các client thông minh sẽ tranh nhau trở thành người đầu tiên trong danh sách vào thời điểm thị trường mở cửa mỗi ngày.

Có một số cách giảm nhẹ vấn đề này. Multicast bằng reliable UDP là một cách tốt để broadcast update đồng thời đến nhiều participant. MDP cũng có thể randomize thứ tự khi subscriber kết nối. Hãy tìm hiểu multicast chi tiết hơn.

**Multicast**

Data được truyền trên Internet bằng ba loại protocol khác nhau, hãy xem nhanh:

1. **Unicast**: một source, một destination.
2. **Broadcast**: một source, gửi đến toàn bộ subnet.
3. **Multicast**: một source, gửi đến một nhóm host có thể nằm trên các subnet khác nhau.

Multicast là protocol thường được dùng trong thiết kế sàn giao dịch. Bằng cách cấu hình nhiều receiver vào cùng một multicast group, về lý thuyết chúng có thể nhận data đồng thời. Tuy nhiên, UDP là một unreliable protocol, datagram có thể không đến được tất cả receiver. Có các giải pháp xử lý vấn đề retransmission [29].

### Colocation

Nhân nói về fairness, có một sự thật đáng nhắc đến: nhiều sàn giao dịch cung cấp dịch vụ colocation, deploy server của hedge fund hoặc broker trong cùng data center với sàn giao dịch. Latency từ lúc đặt order trên server đến lúc matching engine xử lý về bản chất tỷ lệ thuận với chiều dài network cable. Colocation không trái với nguyên tắc fairness; có thể xem đây là một dịch vụ gia tăng VIP trả phí.

### Network Security

Sàn giao dịch thường cung cấp một số public interface; DDoS attack là một thách thức có thật. Dưới đây là một số kỹ thuật ứng phó DDoS:

1. Tách public service và data khỏi private service để DDoS attack không ảnh hưởng đến khách hàng quan trọng nhất. Nếu cần cung cấp cùng một data, có thể thiết lập nhiều read-only replica để cô lập vấn đề.
2. Dùng cache layer để lưu data không thường xuyên update. Với cache tốt, phần lớn query sẽ không truy cập trực tiếp database.
3. Hardening URL trước DDoS. Ví dụ với URL như `https://my.website.com/data?from=123&to=456`, attacker có thể dễ dàng sửa query string để tạo ra rất nhiều request khác nhau. Ngược lại, URL như `https://my.website.com/data/recent` hiệu quả hơn và cũng dễ cache hơn ở CDN layer.
4. Cần có cơ chế whitelist/blacklist hiệu quả. Nhiều network gateway product cung cấp chức năng này.
5. Rate limiting là một cách phổ biến để phòng thủ trước DDoS attack.

## Bước 4 - Tóm tắt

Sau khi đọc xong chương này, có thể bạn sẽ kết luận rằng deployment model lý tưởng của sàn giao dịch lớn là đặt mọi thứ trên một server lớn, thậm chí trong một process duy nhất. Quả thực, một số sàn giao dịch được thiết kế đúng như vậy!

Với sự phát triển gần đây của ngành cryptocurrency, nhiều crypto exchange sử dụng cloud infrastructure để deploy service [30]. Một số dự án decentralized finance dựa trên khái niệm AMM (Automated Market Making), thậm chí không cần order book truyền thống.

Sự tiện lợi của cloud ecosystem đã thay đổi một phần thiết kế và hạ thấp rào cản gia nhập ngành. Điều này chắc chắn sẽ tiếp thêm sức sống đổi mới cho thế giới tài chính.

Chúc mừng bạn đã kiên trì đến cuối! Hãy tự thưởng cho bản thân nhé, bạn đã làm rất tốt!

## Tóm tắt chương

![Hình 13.25: Tóm tắt chương](../images/v2/chapter13/Figure13.25.jpg)

## Tài liệu tham khảo

[1] LMAX Exchange nổi tiếng với Disruptor mã nguồn mở. https://www.lmax.com/exchange  
[2] IEX thu hút nhà đầu tư bằng “cạnh tranh công bằng”, còn được gọi là “sàn giao dịch Flash Boys”. https://en.wikipedia.org/wiki/IEX  
[3] Khối lượng giao dịch khớp lệnh của NYSE. https://www.nyse.com/markets/us-equity-volumes  
[4] Khối lượng giao dịch trung bình hằng ngày của Hong Kong Stock Exchange. https://www.hkex.com.hk/Market-Data/Statistics/Consolidated-Reports/Securities-Statistics-Archive/Trading_Value_Volume_And_Number_Of_Deals?sc_lang=en#select1=0  
[5] Quy mô các sàn giao dịch chứng khoán lớn trên thế giới. http://money.visualcapitalist.com/all-of-the-worlds-stock-exchanges-by-size/  
[6] Denial-of-service attack. https://en.wikipedia.org/wiki/Denial-of-service_attack  
[7] Market impact. https://en.wikipedia.org/wiki/Market_impact  
[8] FIX trading protocol. https://www.fixtrading.org/  
[9] Event sourcing. https://martinfowler.com/eaaDev/EventSourcing.html  
[10] Dịch vụ colocation và data center của CME. https://www.cmegroup.com/trading/colocation/co-location-services.html  
[11] Epoch time. https://www.epoch101.com/  
[12] Order book (Investopedia). https://www.investopedia.com/terms/o/order-book.asp  
[13] Order book (Wikipedia). https://en.wikipedia.org/wiki/Order_book  
[14] Cách xây dựng limit order book nhanh. https://bit.ly/3ngMtEO  
[15] Phát triển với kdb+ và ngôn ngữ q. https://code.kx.com/q/  
[16] Những con số về latency mà mọi programmer nên biết. https://gist.github.com/jboner/2841832  
[17] mmap. https://en.wikipedia.org/wiki/Memory_map  
[18] Context switch. https://bit.ly/3pva7A6  
[19] Reliable User Datagram Protocol. https://en.wikipedia.org/wiki/Reliable_User_Datagram_Protocol  
[20] Aeron. https://github.com/real-logic/aeron/wiki/Design-Overview  
[21] Chaos engineering. https://en.wikipedia.org/wiki/Chaos_engineering  
[22] Raft. https://raft.github.io/  
[23] Thiết kế dễ hiểu của Raft consensus algorithm. https://raft.github.io/slides/uiuc2016.pdf  
[24] Các matching algorithm được hỗ trợ. https://bit.ly/3aYoCEo  
[25] Dark pool. https://www.investopedia.com/terms/d/dark-pool.asp  
[26] HdrHistogram: histogram dynamic range cao. http://hdrhistogram.org/  
[27] HotSpot virtual machine. https://en.wikipedia.org/wiki/HotSpot_(virtual_machine)  
[28] Cache line padding. https://bit.ly/31ZTFWz  
[29] NACK-Oriented Reliable Multicast. https://en.wikipedia.org/wiki/NACK-Oriented_Reliable_Multicast  
[30] AWS Coinbase case study. https://aws.amazon.com/solutions/case-studies/coinbase/
