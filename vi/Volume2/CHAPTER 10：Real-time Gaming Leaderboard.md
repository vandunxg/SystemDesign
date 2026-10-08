# Chương 10 Bảng xếp hạng game theo thời gian thực

Trong chương này, chúng ta sẽ thảo luận cách thiết kế bảng xếp hạng cho một game di động trực tuyến.

Bảng xếp hạng là gì? Bảng xếp hạng rất phổ biến trong game và nhiều lĩnh vực khác, dùng để hiển thị ai đang dẫn đầu trong một mùa giải hoặc trận đấu cụ thể. Sau khi hoàn thành nhiệm vụ hoặc thử thách, người dùng sẽ được cộng điểm, và người có điểm cao nhất sẽ đứng đầu bảng xếp hạng. Hình 10.1 là ví dụ về bảng xếp hạng của một game di động. Bảng xếp hạng hiển thị thứ hạng của những đối thủ dẫn đầu, đồng thời cũng hiển thị vị trí của người dùng trên bảng.

> Ghi chú của người dịch: trong bản gốc, season là particular tournament, thường được dịch là một giải đấu hoặc cuộc thi cụ thể. Trong bối cảnh game, dịch là mùa giải sẽ phù hợp hơn với thói quen của độc giả trong nước. Các cụm particular tournament về sau cũng được dịch là mùa giải.

![Figure10.1](../../images/v2/chapter10/Figure10.1.png)
Hình 10.1: Bảng xếp hạng


## Bước 1 - Hiểu vấn đề và xác định phạm vi thiết kế

Bảng xếp hạng có thể rất đơn giản, nhưng nhiều yếu tố khác nhau có thể làm tăng độ phức tạp. Chúng ta cần làm rõ các yêu cầu.

Ứng viên: Điểm trên bảng xếp hạng được tính như thế nào?

Người phỏng vấn: Người dùng sẽ nhận được một điểm khi thắng một trận đấu. Chúng ta có thể dùng một hệ thống điểm đơn giản, trong đó mỗi người dùng có một điểm số gắn với họ. Mỗi khi người dùng thắng một trận đấu, chúng ta sẽ cộng một điểm vào tổng điểm của họ.

Ứng viên: Bảng xếp hạng có bao gồm tất cả người chơi không?

Người phỏng vấn: Có.

Ứng viên: Bảng xếp hạng có khoảng thời gian không?

Người phỏng vấn: Mỗi tháng sẽ bắt đầu một mùa giải mới và một bảng xếp hạng mới.

Ứng viên: Có thể giả định rằng chúng ta chỉ quan tâm đến 10 người dùng đứng đầu không?

Người phỏng vấn: Chúng ta muốn hiển thị 10 người dùng đứng đầu trên bảng xếp hạng và vị trí của một người dùng cụ thể. Nếu còn thời gian, chúng ta cũng sẽ thảo luận cách trả về 4 người dùng đứng trên và 4 người dùng đứng dưới một người dùng cụ thể.

Ứng viên: Một mùa giải có bao nhiêu người dùng?

Người phỏng vấn: Số người dùng hoạt động hằng ngày (DAU) trung bình là 5 triệu, còn số người dùng hoạt động hằng tháng (MAU) trung bình là 25 triệu.

Ứng viên: Trung bình một mùa giải diễn ra bao nhiêu trận đấu?

Người phỏng vấn: Mỗi người chơi trung bình chơi 10 trận mỗi ngày.

Ứng viên: Nếu hai người chơi có cùng điểm, thứ hạng được xác định như thế nào?

Người phỏng vấn: Trong trường hợp này, họ có cùng thứ hạng. Nếu còn thời gian, chúng ta có thể thảo luận cách phá hòa.

Ứng viên: Bảng xếp hạng có bắt buộc phải theo thời gian thực không?

Người phỏng vấn: Có, chúng ta muốn hiển thị kết quả theo thời gian thực hoặc gần thời gian thực nhất có thể. Không thể hiển thị kết quả lịch sử theo batch.

Bây giờ chúng ta đã thu thập đủ yêu cầu, hãy liệt kê các yêu cầu chức năng.

### Yêu cầu chức năng
* Hiển thị 10 người chơi đứng đầu trên bảng xếp hạng.

* Hiển thị thứ hạng cụ thể của người dùng.

* Hiển thị 4 người chơi đứng trên và 4 người chơi đứng dưới người dùng được chỉ định trên bảng xếp hạng.

Ngoài các yêu cầu chức năng rõ ràng, việc hiểu các yêu cầu phi chức năng cũng rất quan trọng.

### Yêu cầu phi chức năng
* Cập nhật điểm theo thời gian thực.

* Việc cập nhật điểm được phản ánh theo thời gian thực trên bảng xếp hạng.

* Các yêu cầu phổ biến về khả năng mở rộng, tính sẵn sàng và độ tin cậy.

### Ước tính sơ bộ

Hãy thực hiện một vài phép tính đơn giản để xác định quy mô và thách thức tiềm ẩn mà giải pháp cần xử lý.

Với 5 triệu DAU, nếu người chơi phân bố đều trong 24 giờ thì trung bình mỗi giây sẽ có 50 người dùng $({5,000,000 DAU \over 10^6 seconds}\approx 50)$. Tuy nhiên, chúng ta biết số lượng người dùng nhiều khả năng không phân bố đều; lưu lượng có thể đạt đỉnh vào buổi tối vì nhiều người ở các múi giờ khác nhau có thời gian chơi game. Để tính đến điều này, chúng ta có thể giả định tải đỉnh gấp 5 lần mức trung bình. Vì vậy, chúng ta muốn cho phép tải đỉnh 250 người dùng mỗi giây.

QPS nhận điểm của người dùng: nếu trung bình mỗi ngày một người dùng chơi 10 trận, QPS nhận điểm của người dùng là: $50\times10\approx 500$. QPS đỉnh gấp 5 lần mức trung bình: $500\times5=2500$.

QPS lấy 10 người đứng đầu bảng xếp hạng: giả sử người dùng mở game một lần mỗi ngày, và 10 người đứng đầu bảng chỉ được tải khi người dùng mở game lần đầu. QPS của thao tác này xấp xỉ 50.

## Bước 2 - Đề xuất thiết kế cấp cao và nhận phê duyệt

Trong phần này, chúng ta sẽ thảo luận về thiết kế interface, thiết kế cấp cao và mô hình dữ liệu của ứng dụng.

### Thiết kế API

Ở cấp cao, chúng ta cần ba API sau:

#### `POST /v1/scores`

Cập nhật vị trí của người dùng trên bảng xếp hạng khi người dùng thắng game. Các tham số request như sau. Đây nên là một internal API, chỉ được gọi bởi game server. Client không thể trực tiếp cập nhật điểm trên bảng xếp hạng.

| Trường | Mô tả |
|------|------|
| user_id | Người dùng thắng game |
| points | Điểm người dùng nhận được khi thắng game |

Bảng 10.1: Tham số request

Response:
| Trường | Mô tả |
|------|------|
| 200 OK | Cập nhật điểm người dùng thành công |
| 400 Bad Request | Cập nhật điểm người dùng thất bại |

Bảng 10.2: Response

#### `GET /v1/scores`

Lấy 10 người dùng đứng đầu bảng xếp hạng.

Ví dụ response:
```json
{
    "data":[   
        {
            "user_id": "user_id1",
            "user_name": "alice",
            "rank": 1,
            "score": 976
        },
        {
            "user_id": "user_id2",
            "user_name": "bob",
            "rank": 2,
            "score": 965
        }
    ],
    "total": 10
}
```

#### `GET /v1/scores/{:user_id}`

Lấy thứ hạng của người dùng được chỉ định.

| Trường | Mô tả |
|------|------|
| user_id | ID của người dùng mà chúng ta muốn lấy thứ hạng |

Bảng 10.3: Tham số request

Ví dụ response:
```json
{
    "user_info": {
        "user_id": "user5",
        "score": 940,
        "rank": 6,
    }
}
```

### Thiết kế cấp cao

Sơ đồ thiết kế cấp cao được trình bày trong Hình 10.2. Thiết kế này có hai service. Game service cho phép người dùng chơi game; leaderboard service tạo và hiển thị bảng xếp hạng.

![Figure10.2](../../images/v2/chapter10/Figure10.2.png)
Hình 10.2: Sơ đồ thiết kế cấp cao

1. Người chơi thắng game, client gửi một request đến game service.
2. Game service xác nhận chiến thắng hợp lệ rồi gọi leaderboard service để cập nhật điểm.
3. Leaderboard service cập nhật điểm trong user database.
5. Người chơi gọi trực tiếp leaderboard service để lấy dữ liệu bảng xếp hạng, bao gồm:

    (a) 10 người đứng đầu bảng xếp hạng.

    (b) Thứ hạng của người chơi đó trên bảng xếp hạng.

Trước khi quyết định thiết kế này, chúng ta đã cân nhắc một số phương án thay thế nhưng cuối cùng quyết định loại bỏ. Việc xem xét và so sánh các phương án khác nhau có thể hữu ích.

#### Client có giao tiếp trực tiếp với leaderboard service không?

![Figure10.3.png](../../images/v2/chapter10/Figure10.3.png)
Hình 10.3: Ai thiết lập điểm trên bảng xếp hạng

Trong một thiết kế khác, điểm được client thiết lập. Phương án này không an toàn vì dễ bị tấn công man-in-the-middle [1], cho phép người chơi tùy ý thay đổi điểm thông qua proxy. Do đó, chúng ta cần thiết lập điểm ở phía server.

Lưu ý rằng đối với các game do server quản lý (chẳng hạn poker trực tuyến), client có thể không cần gọi rõ ràng đến game server để thiết lập điểm. Game server xử lý toàn bộ logic game, biết khi nào game kết thúc và có thể thiết lập điểm mà không cần client can thiệp.

#### Có cần xây dựng message queue giữa game service và leaderboard service không?
Đáp án cho câu hỏi này phụ thuộc phần lớn vào cách sử dụng điểm game. Nếu dữ liệu được dùng ở nơi khác hoặc hỗ trợ nhiều chức năng, việc đưa dữ liệu vào Kafka như trong Hình 10.4 có thể có ý nghĩa hơn. Khi đó, leaderboard service, analytics service, push notification service và nhiều consumer khác có thể sử dụng cùng một dữ liệu. Khi game là game theo lượt hoặc game nhiều người chơi, message queue đặc biệt quan trọng vì chúng ta cần thông báo cho những người chơi khác về việc cập nhật điểm. Dựa trên cuộc trao đổi với người phỏng vấn, đây không phải là một yêu cầu rõ ràng, nên chúng ta không sử dụng message queue trong thiết kế.

![Figure10.4.png](../../images/v2/chapter10/Figure10.4.png)
Hình 10.4: Điểm game được nhiều service sử dụng

### Mô hình dữ liệu
Một trong những thành phần then chốt của hệ thống là leaderboard storage. Chúng ta sẽ thảo luận ba giải pháp khả thi: relational database, Redis và NoSQL (giải pháp NoSQL sẽ được giải thích trong phần thiết kế chuyên sâu của bài viết này).

#### Giải pháp relational database
> Ghi chú của người dịch: relational database trong nguyên bản là Realational database solution, cũng có thể dịch là giải pháp cơ sở dữ liệu quan hệ.

Trước tiên, hãy lùi lại một bước và bắt đầu từ giải pháp đơn giản nhất. Nếu quy mô không quan trọng và chúng ta chỉ có một vài người dùng, nên thiết kế như thế nào?

Nhiều khả năng chúng ta sẽ chọn một hệ thống relational database (RDS) để cung cấp giải pháp bảng xếp hạng đơn giản. Bảng xếp hạng của mỗi tháng có thể được biểu diễn bằng một database table gồm cột user ID và score. Khi người dùng thắng một trận đấu, nếu là người dùng mới thì cộng 1 điểm, còn nếu là người dùng cũ thì tăng thêm 1 điểm. Để xác định thứ hạng của người dùng trên bảng xếp hạng, chúng ta sẽ sắp xếp điểm trong bảng theo thứ tự giảm dần. Chi tiết như sau.

![Figure10.5.png](../../images/v2/chapter10/Figure10.5.png)
Hình 10.5: Bảng leaderboard

Trên thực tế, bảng leaderboard còn chứa thông tin khác như game_id, timestamp, v.v. Tuy nhiên, logic cơ bản để query và update bảng xếp hạng vẫn giống nhau. Để đơn giản, chúng ta giả định bảng leaderboard chỉ lưu dữ liệu bảng xếp hạng của tháng hiện tại.

**Người dùng nhận điểm**

![Figure10.6.png](../../images/v2/chapter10/Figure10.6.png)
Hình 10.6: Người dùng nhận điểm

Giả sử mỗi lần cập nhật điểm đều tăng 1. Nếu người dùng chưa có entry trong bảng xếp hạng của tháng, nội dung được insert lần đầu là:

```sql
INSERT INTO leaderboard (user_id, score) VALUES (‘mary1934’, 1);
```

Cập nhật điểm của người dùng:

```sql
UPDATE leaderboard set score=score + 1 where user_id='mary1934'；
```

**Truy vấn thứ hạng của người dùng trên bảng xếp hạng**

![Figure10.7.png](../../images/v2/chapter10/Figure10.7.png)
Hình 10.7: Truy vấn thứ hạng của người dùng trên bảng xếp hạng

Để lấy thứ hạng của người dùng, chúng ta sẽ sắp xếp bảng leaderboard theo điểm:
```sql
SELECT (@rownum := @rownum + 1) AS rank, user_id, score
FROM leaderboard
ORDER BY score DESC;
```

Kết quả của truy vấn SQL như sau:

| rank | user_id | score |
|------|------|------|
| 1 | happy_tomato | 987 |
| 2 | mallow | 902 |
| 3 | smith | 870 |
| 4 | mary1934 | 850 |

Bảng 10.4: Kết quả sắp xếp theo điểm

Khi dataset nhỏ, giải pháp này vẫn hoạt động tốt, nhưng khi số dòng dữ liệu lên đến hàng triệu, tốc độ query sẽ trở nên rất chậm. Hãy xem lý do tại sao.

Để xác định thứ hạng của người dùng, chúng ta cần sắp xếp từng người chơi vào đúng vị trí trên bảng xếp hạng để xác định thứ hạng chính xác. Hãy nhớ rằng điểm có thể bị trùng, nên thứ hạng không chỉ đơn giản là vị trí của người dùng trong danh sách.

Khi cần xử lý lượng lớn thông tin liên tục thay đổi, hiệu năng của SQL database không lý tưởng. Việc thử sắp xếp hàng triệu dòng sẽ mất 10 giây, không thể chấp nhận được đối với phương pháp cần thời gian thực. Vì dữ liệu liên tục thay đổi nên cũng không khả thi nếu cân nhắc sử dụng cache.

Relational database vốn không được thiết kế để xử lý các query tải cao theo thời gian thực như vậy. Nếu thực hiện theo kiểu batch, có thể sử dụng RDS, nhưng điều này không đáp ứng yêu cầu trả về thứ hạng theo thời gian thực cho người dùng.

Một tối ưu hóa có thể thực hiện là thêm index và dùng câu lệnh LIMIT để giới hạn số page cần scan. Ví dụ:
```sql
SELECT (@rownum := @rownum + 1) AS rank, user_id, score
FROM leaderboard
ORDER BY score DESC
LIMIT 10
```

Tuy nhiên, phương pháp này không scale tốt. Thứ nhất, hiệu năng tìm thứ hạng của người dùng không cao vì về cơ bản nó cần scan cả table để xác định thứ hạng. Thứ hai, phương pháp này không cung cấp giải pháp trực tiếp để xác định thứ hạng của người dùng không nằm ở đầu bảng xếp hạng.

#### Giải pháp Redis

Chúng ta muốn tìm một giải pháp có thể cung cấp hiệu năng ổn định ngay cả khi có hàng triệu người dùng, đồng thời cho phép dễ dàng truy cập các thao tác bảng xếp hạng thường dùng mà không phụ thuộc vào các query database phức tạp.

Redis cung cấp một giải pháp tiềm năng cho vấn đề này. Redis là một in-memory data store hỗ trợ các cặp key-value. Vì hoạt động trong memory nên Redis có thể đọc và ghi nhanh. Redis có một kiểu dữ liệu gọi là **sorted sets**, rất phù hợp để giải quyết bài toán thiết kế hệ thống bảng xếp hạng.

**sorted sets là gì?**

sorted sets là một kiểu dữ liệu tương tự set. Mỗi member của nó được gắn với một score. Các member của set phải là duy nhất, nhưng score có thể trùng nhau. Score được dùng để sắp xếp sorted sets theo thứ tự tăng dần.

Use case bảng xếp hạng của chúng ta ánh xạ hoàn hảo vào sorted sets. Ở bên dưới, sorted sets được triển khai bằng hai cấu trúc dữ liệu: hashtab và skip list [2]. Hash table ánh xạ người dùng với điểm, còn skip list ánh xạ điểm với người dùng. Trong sorted sets, người dùng được sắp xếp theo điểm. Như Hình 10.8, một cách hay để hình dung sorted sets là coi nó như một bảng có cột score và member. Bảng này được sắp xếp theo điểm giảm dần.

![Figure10.8.png](../../images/v2/chapter10/Figure10.8.png)
Hình 10.8: Bảng xếp hạng tháng 2 được biểu diễn bằng sorted sets

Trong chương này, chúng ta sẽ không đi sâu vào toàn bộ chi tiết triển khai của sorted sets mà chỉ giới thiệu một số ý tưởng thiết kế cấp cao.

Skip list là một cấu trúc list có thể thực hiện tìm kiếm nhanh. Nó gồm một linked list cơ bản đã được sắp xếp và nhiều tầng index. Hãy xem một ví dụ. Trong Hình 10.9, list là một singly linked list đã được sắp xếp. Độ phức tạp thời gian của thao tác insert, remove và query là $O(n)$.

Làm thế nào để các thao tác này nhanh hơn? Một cách là nhanh chóng tìm node ở giữa, tương tự thuật toán binary search. Để làm vậy, chúng ta thêm một tầng index bỏ qua các node khác, rồi thêm tầng index thứ hai bỏ qua các node khác của tầng index thứ nhất. Chúng ta tiếp tục thêm nhiều tầng index hơn; mỗi tầng sẽ bỏ qua từng node trong tầng index ngay bên dưới. Chúng ta dừng việc thêm khi khoảng cách giữa các node là $({n \over 2}-1)$ (trong đó n là tổng số node). Như Hình 10.9, khi sử dụng nhiều tầng index, việc tìm số 45 sẽ nhanh hơn nhiều.

![Figure10.9.png](../../images/v2/chapter10/Figure10.9.png)
Hình 10.9: Skip list

Khi dataset nhỏ, việc sử dụng skip list không cải thiện tốc độ rõ rệt. Hình 10.10 cho thấy một skip list có 5 tầng index. Trong linked list cơ bản, cần duyệt qua 62 node để đến đúng node. Trong skip list, chỉ cần duyệt qua 11 node [3].

![Figure10.10.png](../../images/v2/chapter10/Figure10.10.png)
Hình 10.10: Skip list với 5 tầng index

So với relational database, sorted sets có hiệu năng cao hơn vì khi insert hoặc update, mỗi phần tử sẽ tự động được đặt vào đúng vị trí, và độ phức tạp của thao tác add hoặc lookup trong sorted sets là $O\big(log(n)\big)$.

Ngược lại, để tính thứ hạng của một người dùng cụ thể trong relational database, chúng ta cần chạy nested query:
```sql
SELECT *,(SELECT COUNT(*) FROM leaderboard lb2
WHERE lb2.score >= lb1.score) RANK
FROM leaderboard lb1
WHERE lb1.user_id = {:user_id};
```

**Triển khai Redis sorted sets**

Sau khi biết sorted sets rất nhanh, hãy xem các thao tác cụ thể để xây dựng bảng xếp hạng bằng Redis [4] [5] [6] [7]:

- ZADD: nếu người dùng chưa tồn tại, insert người dùng vào dataset. Nếu đã tồn tại, update điểm của người dùng. Thao tác này cần $O\big(log(n)\big)$.

- ZINCRBY: tăng điểm của người dùng theo một lượng tăng chỉ định. Nếu người dùng không tồn tại trong set, điểm được giả định bắt đầu từ 0. Thao tác này cần thời gian $O\big(log(n)\big)$.

- ZRANGE/ZREVRANGE: lấy một range người dùng được sắp xếp theo điểm. Chúng ta có thể chỉ định thứ tự (range và revrange), số entry và vị trí bắt đầu. Thao tác này cần $O\big(log(n)+m\big)$, trong đó m là số entry cần lấy (thường nhỏ trong trường hợp của chúng ta), còn n là số entry trong sorted sets.

- ZRANK/ZREVRANK: lấy vị trí của bất kỳ người dùng nào theo thứ tự tăng/giảm với độ phức tạp logarithmic.

**Workflow của sorted set**

1. Người dùng nhận điểm

![Figure10.11.png](../../images/v2/chapter10/Figure10.11.png)
Hình 10.11: Người dùng nhận điểm

Mỗi tháng chúng ta tạo một sorted sets mới cho bảng xếp hạng, còn sorted sets trước đó được chuyển vào historical data store. Khi người dùng thắng một trận đấu, họ nhận được 1 điểm; vì vậy chúng ta gọi ZINCRBY để tăng điểm của người dùng trên bảng xếp hạng tháng hiện tại thêm 1, hoặc thêm người dùng vào bảng xếp hạng nếu họ chưa có trong đó. Cú pháp của ZINCRBY là:

```shell
ZINCRBY <key> <increment> <user>
```

Lệnh dưới đây cộng một điểm cho người dùng mary1934 sau khi người dùng này thắng trận đấu.

```shell
ZINCRBY leaderboard_feb_2021 1 ‘mary1934’
```

2. Người dùng lấy 10 người đứng đầu global leaderboard

![Figure10.12.png](../../images/v2/chapter10/Figure10.12.png)
Hình 10.12: Người dùng lấy 10 người đứng đầu global leaderboard

Chúng ta sẽ gọi ZREVRANGE để lấy các member theo thứ tự từ cao xuống thấp vì muốn lấy điểm cao nhất, đồng thời dùng thuộc tính WITHSCORES để đảm bảo trả về tổng điểm của từng người dùng cùng với tập người dùng có điểm cao nhất. Lệnh dưới đây sẽ lấy 10 người chơi đứng đầu bảng xếp hạng tháng 2 năm 2021.

```shell
ZREVRANGE leaderboard_feb_2021 0 9 WITHSCORES
```

Danh sách trả về như sau:

```shell
[(user2, score2),(user1, score1),(user5, score5)...]
```

3. Người dùng muốn lấy vị trí của mình trên bảng xếp hạng

![Figure10.13.png](../../images/v2/chapter10/Figure10.13.png)
Hình 10.13: Lấy vị trí của người dùng trên bảng xếp hạng

Để lấy vị trí của người dùng trên bảng xếp hạng, chúng ta sẽ gọi ZREVRANK để lấy thứ hạng của người dùng. Một lần nữa, chúng ta gọi phiên bản rev của command vì muốn sắp xếp điểm từ cao xuống thấp.

```shell
ZREVRANK leaderboard_feb_2021 'mary1934'
```

4. Lấy vị trí tương đối của người dùng trên bảng xếp hạng, như ví dụ trong Hình 10.14.

![Figure10.14.png](../../images/v2/chapter10/Figure10.14.png)
Hình 10.14: Lấy 4 người dùng đứng trên và dưới một người dùng

Mặc dù đây không phải là yêu cầu rõ ràng, chúng ta có thể dễ dàng lấy vị trí tương đối của người dùng bằng ZREVRANGE và số lượng người dùng mong muốn ở phía trên và phía dưới. Ví dụ, nếu người dùng Mallow007 đứng hạng 361 và chúng ta muốn lấy 4 người dùng đứng trên và dưới họ, chúng ta có thể chạy lệnh sau.

```shell
ZREVRANGE leaderboard_feb_2021 357 365
```

**Yêu cầu lưu trữ**

Chúng ta ít nhất cần lưu user ID và điểm. Trường hợp xấu nhất là cả 25 triệu người dùng hoạt động hằng tháng đều thắng ít nhất một game và đều có entry trên bảng xếp hạng của tháng đó. Giả sử user ID là một string dài 24 ký tự, còn score là số nguyên 16 bit (hoặc 2 byte), mỗi entry của bảng xếp hạng cần 26 byte storage. Giả sử trường hợp xấu nhất là mỗi MAU có một entry trên bảng xếp hạng, chúng ta sẽ cần 26 byte x 25 triệu = 650 triệu byte, tương đương khoảng 650 MB, cho phần lưu trữ bảng xếp hạng trong Redis cache. Ngay cả khi tăng gấp đôi mức sử dụng memory để tính overhead của skip list và sorted sets, một Redis server hiện đại cũng đủ để lưu trữ dữ liệu này.

Một yếu tố liên quan khác cần cân nhắc là mức sử dụng CPU và I/O. QPS đỉnh ước tính bằng phương pháp back-of-the-envelope của chúng ta là 2500 update. Con số này hoàn toàn nằm trong khả năng của một Redis server đơn lẻ.

Một vấn đề của Redis cache là persistence vì Redis node có thể gặp sự cố. May mắn là Redis có hỗ trợ persistence, nhưng việc restart một Redis instance lớn từ disk khá chậm. Thông thường, Redis được cấu hình với một read replica; khi primary instance gặp sự cố, read replica sẽ được promote và một read replica mới được attach.

Ngoài ra, chúng ta cũng cần tạo hai support table trong một relational database như MySQL (user table và points table). User table sẽ lưu user ID và display name của người dùng (trong ứng dụng thực tế, bảng này sẽ chứa nhiều dữ liệu hơn). Points table sẽ chứa user ID, điểm và timestamp của mỗi lần thắng game. Dữ liệu này có thể được dùng cho các tính năng khác của game như lịch sử chơi, đồng thời dùng để tạo lại bảng xếp hạng Redis khi infrastructure gặp sự cố.

Để tối ưu hiệu năng một chút, có thể nên tạo thêm một cache cho thông tin chi tiết của người dùng vì thông tin của 10 người chơi đứng đầu được truy xuất thường xuyên nhất. Cache này không tạo ra nhiều dữ liệu.

### Thiết kế chuyên sâu

Sau khi đã thảo luận về thiết kế cấp cao, hãy cùng đi sâu vào các chủ đề sau:

- Có sử dụng cloud provider hay không
    - Quản lý service
    - Sử dụng cloud service như AWS
- Redis scaling
- Phương án thay thế: NoSQL
- Các yếu tố khác cần cân nhắc

#### Có sử dụng cloud service hay không

Tùy thuộc vào infrastructure hiện có, chúng ta thường có hai lựa chọn triển khai solution. Hãy xem từng lựa chọn.

**Quản lý service**

Với phương pháp này, mỗi tháng chúng ta tạo một sorted sets để lưu dữ liệu bảng xếp hạng của giai đoạn đó. Sorted sets lưu thông tin người dùng và điểm. Các thông tin khác của người dùng (như tên và ảnh profile) được lưu trong MySQL database. Khi lấy bảng xếp hạng, ngoài dữ liệu bảng xếp hạng, API server còn query database để lấy username và ảnh profile tương ứng rồi hiển thị trên bảng xếp hạng. Nếu làm vậy trong thời gian dài thì hiệu quả quá thấp, chúng ta có thể cache thông tin chi tiết của 10 người chơi đứng đầu. Thiết kế được minh họa trong Hình 10.15.

![Figure10.15.png](../../images/v2/chapter10/Figure10.15.png)
Hình 10.15: Quản lý service

**Sử dụng cloud service**

Phương pháp thứ hai là tận dụng cloud infrastructure. Trong phần này, chúng ta giả định infrastructure hiện có được xây dựng trên AWS, vì vậy xây dựng bảng xếp hạng trên cloud là một lựa chọn tự nhiên. Trong thiết kế này, chúng ta sử dụng hai công nghệ AWS chính: Amazon API Gateway và AWS Lambda function [8]. Amazon API Gateway cung cấp một cách định nghĩa HTTP endpoint cho RESTful API và kết nối endpoint đó với bất kỳ backend service nào. Chúng ta dùng nó để kết nối các AWS lambda function. Bảng 10.5 cho thấy mapping giữa các API nguồn và Lambda function.

| APIs | Lambda function |
|------|------|
| GET /v1/scores | LeaderboardFetchTop10 |
| GET /v1/scores/{:user_id} | LeaderboardFetchPlayerRank |
| POST /v1/scores | LeaderboardUpdateScore |

Bảng 10.5: Lambda function

AWS Lambda là một trong những serverless computing platform phổ biến nhất. Nó cho phép chúng ta chạy code mà không cần tự cấu hình hoặc quản lý server. Lambda chỉ chạy khi cần và tự động scale theo traffic. Serverless là một trong những chủ đề nóng nhất trong lĩnh vực cloud service, và tất cả cloud service provider lớn đều hỗ trợ nó. Ví dụ, Google Cloud có Google Cloud Functions [9], còn Microsoft đặt tên sản phẩm của mình là Microsoft Azure Functions [10].

Ở cấp cao, game sẽ gọi Amazon API Gateway, rồi API Gateway gọi lambda function tương ứng. Chúng ta sẽ dùng AWS Lambda function để gọi command tương ứng trên storage layer (Redis và MySQL), trả kết quả về API Gateway, rồi API Gateway trả kết quả về application.

Chúng ta có thể dùng Lambda function để thực hiện các query cần thiết mà không phải khởi chạy server instance. AWS hỗ trợ Redis client có thể được gọi từ Lambda function. Điều này cũng cho phép tự động scale khi DAU tăng. Sơ đồ thiết kế cập nhật điểm người dùng và lấy bảng xếp hạng như sau:

**Ví dụ 1: Điểm**

![Figure10.16.png](../../images/v2/chapter10/Figure10.16.png)
Hình 10.16: Điểm

**Ví dụ 2: Lấy bảng xếp hạng**

![Figure10.17.png](../../images/v2/chapter10/Figure10.17.png)
Hình 10.17: Lấy bảng xếp hạng

Lambda rất tuyệt vì đây là một phương pháp serverless, trong đó infrastructure tự động scale chức năng theo nhu cầu. Điều này có nghĩa là chúng ta không cần quản lý việc scaling, thiết lập environment và maintenance. Vì vậy, nếu xây dựng game từ đầu, chúng tôi khuyến nghị sử dụng phương pháp serverless.

#### Redis scaling

Với 5 triệu DAU, xét về storage và QPS, chúng ta chỉ cần một Redis cache. Tuy nhiên, giả sử có 500 triệu DAU, tức gấp 100 lần quy mô ban đầu. Khi đó, trong trường hợp xấu nhất, quy mô bảng xếp hạng sẽ tăng lên 65 GB (650MB x 100), còn QPS sẽ tăng lên 250,000 query mỗi giây (2,500 x 100). Điều này đòi hỏi một giải pháp sharding.

> Ghi chú của người dịch: cách tính này chỉ xét từ góc độ storage; trong nghiệp vụ thực tế, chúng ta còn cần cân nhắc vấn đề hot key và big key của Redis.

**Sharding dữ liệu**

Chúng ta cân nhắc sharding theo một trong hai cách sau: fixed sharding hoặc hash sharding.

**Fixed sharding**

Một cách để hiểu fixed partition là xem toàn bộ range điểm trên bảng xếp hạng. Giả sử điểm đạt được trong một tháng nằm trong khoảng từ 1 đến 1000, chúng ta chia dữ liệu theo range. Ví dụ, có thể có 10 partition, mỗi partition có range 100 điểm (chẳng hạn 1 ~ 100, 101 ~ 200, 201 ~ 300, ...), như Hình 10.18.

![Figure10.18.png](../../images/v2/chapter10/Figure10.18.png)
Hình 10.18: Fixed sharding

Để làm vậy, chúng ta phải đảm bảo điểm trên bảng xếp hạng phân bố đều. Nếu không, chúng ta cần điều chỉnh range điểm của mỗi partition để đảm bảo điểm phân bố tương đối đều. Trong phương pháp này, chính chúng ta thực hiện sharding dữ liệu trong application code.

Khi insert hoặc update điểm của người dùng, chúng ta cần biết người dùng thuộc partition nào. Có thể tính điểm hiện tại của người dùng từ MySQL database. Phương pháp này khả thi, nhưng một phương pháp có hiệu năng tốt hơn là tạo secondary cache để lưu mapping từ user ID đến điểm. Khi người dùng tăng điểm và di chuyển giữa các shard, chúng ta cần cẩn thận. Trong trường hợp này, cần remove người dùng khỏi shard hiện tại và chuyển họ sang shard mới.

Để lấy 10 người chơi đứng đầu bảng xếp hạng, chúng ta cần lấy 10 người chơi đứng đầu từ shard có điểm cao nhất (sorted sets). Trong Hình 10.18, shard cuối cùng có điểm [901, 1000] chứa 10 người chơi đứng đầu.

Để lấy thứ hạng của người dùng, chúng ta cần tính thứ hạng của người dùng trong partition hiện tại (local rank), cùng với tổng số người chơi có điểm cao hơn trong tất cả allocation. Lưu ý rằng có thể lấy tổng số người chơi trong partition bằng cách chạy lệnh info keyspace với độ phức tạp $O(1)$ [11].

**Hash sharding**

Phương pháp thứ hai là sử dụng Redis cluster, phù hợp khi điểm tập trung hoặc phân thành các cụm. Redis cluster cung cấp một cách tự động shard giữa nhiều Redis node. Nó không sử dụng consistent hashing mà dùng một dạng sharding khác, trong đó mỗi key là một phần của hash slot. Có 16384 hash slot [12], và chúng ta có thể tính hash slot của một key bằng CRC16(key) %16384 [13]. Khi đó, chúng ta có thể dùng phương pháp trong Hình 10.19 với 3 node:

- Node thứ nhất chứa các hash slot [0,5500].
- Node thứ hai chứa các hash slot [5501, 11000].
- Node thứ ba chứa các hash slot [11001, 16383].

![Figure10.19.png](../../images/v2/chapter10/Figure10.19.png)
Hình 10.19: Hash sharding

Update chỉ cần thay đổi điểm của người dùng trong shard tương ứng (do CRC16(key) %16384 quyết định). Việc lấy 10 người chơi đứng đầu bảng xếp hạng phức tạp hơn. Chúng ta cần thu thập 10 người chơi đứng đầu của mỗi partition và để application sắp xếp dữ liệu. Ví dụ cụ thể được trình bày trong Hình 10.20. Các query này có thể được xử lý song song để giảm latency.

![Figure10.20.png](../../images/v2/chapter10/Figure10.20.png)
Hình 10.20: Scatter-gather

Phương pháp này có một số hạn chế:

- Khi cần trả về k kết quả đầu bảng xếp hạng (trong đó k là một số rất lớn), latency sẽ cao vì mỗi shard phải trả về một lượng lớn entry và cần sắp xếp chúng.
- Nếu có nhiều shard, latency sẽ cao vì query phải chờ shard chậm nhất.
- Một vấn đề khác của phương pháp này là nó không cung cấp giải pháp trực tiếp để xác định thứ hạng của một người dùng cụ thể.

Vì vậy, chúng ta nghiêng về phương án đầu tiên: fixed sharding.

**Xác định kích thước Redis node**

Khi xác định kích thước Redis node, cần cân nhắc nhiều khía cạnh [14]. Ứng dụng có lượng write lớn cần nhiều memory khả dụng hơn vì phải có đủ chỗ chứa toàn bộ write để tạo snapshot khi xảy ra sự cố. Để an toàn, ứng dụng có lượng write lớn nên được cấp lượng memory gấp đôi.

#### Phương án thay thế: NoSQL

Một giải pháp thay thế là cân nhắc sử dụng NoSQL database. Chúng ta nên chọn loại NoSQL database nào? Lý tưởng nhất, chúng ta muốn chọn một NoSQL database có các đặc điểm sau:

- Được tối ưu cho thao tác write.
- Có thể sắp xếp item hiệu quả theo điểm trong một partition.

Các NoSQL database như DynamoDB của Amazon [16], Cassandra hoặc MongoDB đều là những lựa chọn tốt. Trong chương này, chúng ta lấy DynamoDB làm ví dụ. DynamoDB là một NoSQL database được quản lý hoàn toàn, cung cấp hiệu năng đáng tin cậy và khả năng mở rộng xuất sắc. Để truy cập hiệu quả các thuộc tính khác ngoài primary key, chúng ta có thể sử dụng global secondary index trong DynamoDB [17]. Global secondary index chứa các thuộc tính được chọn từ parent table, nhưng được tổ chức theo một cách khác về primary key. Hãy xem một ví dụ.

Kiến trúc hệ thống sau khi cập nhật được minh họa trong Hình 10.21. Redis và MySQL được thay thế bằng DynamoDB.

![Figure10.21.png](../../images/v2/chapter10/Figure10.21.png)
Hình 10.21: Giải pháp DynamoDB

Giả sử chúng ta thiết kế bảng xếp hạng cho một game cờ vua, bảng ban đầu như trong Hình 10.22. Đây là một denormalized view của leaderboard view và user table, chứa toàn bộ dữ liệu cần thiết để render bảng xếp hạng.

![Figure10.22.png](../../images/v2/chapter10/Figure10.22.png)
Hình 10.22: Denormalized view của bảng xếp hạng và user table

Cấu trúc bảng này có thể sử dụng được nhưng không scale tốt. Khi thêm nhiều row, chúng ta phải scan toàn bộ table để tìm item có điểm cao nhất.

> Ghi chú của người dịch: PDF gốc là bản scan nên thiếu một phần nội dung; tôi đã liên hệ với ngữ cảnh của bài viết để bổ sung.

Để tránh linear scan, chúng ta cần thêm index. Thử nghiệm đầu tiên là dùng year-month làm partition key và score làm sort key, như trong Hình 10.23.

![Figure10.23.png](../../images/v2/chapter10/Figure10.23.png)
Hình 10.23: Partition key và sort key

Thiết kế này sẽ gặp vấn đề dưới tải cao. DynamoDB dùng consistent hashing để phân phối dữ liệu trên nhiều node. Mỗi data item được ánh xạ đến node tương ứng dựa trên partition key.

Trong thiết kế bảng nói trên (Hình 10.23), toàn bộ dữ liệu của tháng gần nhất sẽ tập trung trong cùng một partition, tạo thành một “hot partition”. Làm thế nào để giải quyết vấn đề này?

Một cách là chia dữ liệu thành nhiều partition và nối thêm partition number vào partition key (ví dụ user_id % n, trong đó n là số partition). Pattern này được gọi là write sharding. Nó làm tăng độ phức tạp của thao tác read và write, vì vậy cần cân nhắc cẩn thận.

Câu hỏi quan trọng cần trả lời là nên sử dụng bao nhiêu partition? Điều này phụ thuộc vào write volume hoặc DAU (số người dùng hoạt động hằng ngày). Điều quan trọng là đảm bảo load được phân bố đều trên nhiều partition để giảm độ phức tạp của thao tác read.

Vì dữ liệu của cùng một tháng được phân bố trên nhiều partition, để đọc dữ liệu của một tháng nhất định, phải query kết quả từ tất cả partition, làm tăng độ phức tạp của thao tác read.

Thiết kế partition key sau khi cập nhật như sau: `game_name#{year-month}#p{partition_number}`. Đây là cấu trúc bảng sau khi cập nhật.

![Figure10.24.png](../../images/v2/chapter10/Figure10.24.png)
Hình 10.24: Partition key sau khi cập nhật

Global secondary index sử dụng `game_name#{year-month}#p{partition_number}` làm partition key và sử dụng score làm sort key. Cuối cùng, chúng ta có n partition, bên trong mỗi partition đều được sắp xếp (local ordering). Giả sử có 3 partition, để lấy 10 người đứng đầu bảng xếp hạng, chúng ta sẽ dùng phương pháp "scatter-gather" đã đề cập trước đó. Chúng ta lấy 10 kết quả đầu từ mỗi partition (đây là phần "scatter"), sau đó để application sắp xếp kết quả của tất cả partition (đây là phần "gather"). Như trong Hình 10.25.

![Figure10.25.png](../../images/v2/chapter10/Figure10.25.png)
Hình 10.25: Scatter-gather

Làm thế nào để quyết định số lượng partition? Việc này cần được benchmark cẩn thận. Nhiều partition hơn sẽ giảm tải trên mỗi partition, nhưng cũng làm tăng độ phức tạp vì chúng ta phải thực hiện scatter trên nhiều partition hơn để xây dựng bảng xếp hạng cuối cùng. Benchmark sẽ giúp chúng ta nhìn rõ hơn trade-off này.

Tuy nhiên, tương tự phương án Redis partition đã đề cập trước đó, phương pháp này không thể trực tiếp lấy thứ hạng chính xác của người dùng. Dù vậy, chúng ta có thể lấy percentile về vị trí của người dùng, điều này có thể đã đủ tốt trong ứng dụng thực tế. Trên thực tế, nói cho người chơi biết họ nằm trong top 10-20% có thể tốt hơn hiển thị thứ hạng cụ thể (chẳng hạn 1,200,001). Vì vậy, nếu quy mô lớn đến mức cần sharding, chúng ta có thể giả định phân bố điểm trên tất cả shard gần như giống nhau. Nếu giả định này đúng, chúng ta có thể dùng một scheduled task để phân tích phân bố điểm của mỗi shard và cache kết quả.

Kết quả sẽ như sau:
Percentile thứ 10 = score < 100
Percentile thứ 20 = score < 500
...
Percentile thứ 90 = score < 6500

Sau đó chúng ta có thể nhanh chóng trả về thứ hạng tương đối của người dùng (chẳng hạn percentile thứ 90).

## Bước 4 - Tóm tắt

Trong chương này, chúng ta đã tạo một giải pháp bảng xếp hạng game theo thời gian thực hỗ trợ hàng triệu DAU. Chúng ta đã tìm hiểu giải pháp trực tiếp sử dụng MySQL database, nhưng loại bỏ phương pháp này vì nó không thể scale đến hàng triệu người dùng. Sau đó, chúng ta thiết kế bảng xếp hạng bằng Redis sorted set. Chúng ta cũng scale giải pháp đến 500 triệu DAU bằng cách sử dụng sharding giữa các Redis cache khác nhau. Ngoài ra, chúng ta đề xuất một giải pháp NoSQL thay thế.

Nếu còn thời gian sau khi kết thúc buổi phỏng vấn, bạn có thể thảo luận các chủ đề sau:

**Truy xuất nhanh hơn và phá hòa khi cùng thứ hạng**

Redis hash table cung cấp mapping giữa string field và value. Chúng ta có thể tận dụng hash cho hai use case:
1. Lưu mapping từ user ID đến user object để hiển thị trên bảng xếp hạng. Cách này nhanh hơn lấy user object từ database.
2. Khi hai người chơi có cùng điểm, chúng ta có thể xếp hạng người dùng dựa trên việc ai đạt điểm đó trước. Khi tăng điểm của người dùng, chúng ta cũng có thể lưu mapping từ user ID đến timestamp của lần thắng gần nhất. Khi hòa, timestamp sớm hơn sẽ có thứ hạng cao hơn.

**Khôi phục sau sự cố hệ thống**

Redis cluster có thể gặp sự cố trên diện rộng. Dựa trên thiết kế trên, chúng ta có thể tạo một script sử dụng timestamp của mỗi lần người dùng thắng được ghi trong MySQL database. Chúng ta có thể duyệt qua toàn bộ record của từng người dùng và gọi command ZINCRBY một lần cho mỗi record của mỗi người dùng. Nhờ đó, khi xảy ra sự cố trên diện rộng, chúng ta có thể rebuild bảng xếp hạng offline.

Chúc mừng bạn đã kiên trì đến đây! Hãy tự vỗ vai mình một cái, làm tốt lắm!

### Tóm tắt chương

![Summary.png](../../images/v2/chapter10/Summary.png)

## Tài liệu tham khảo

[1] Man-in-the-middle attack. https://en.wikipedia.org/wiki/Man-in-the-middle_attack.

[2] Redis Sorted Set source code. https://github.com/redis/redis/blob/unstable/src/t_zset.c.

[3] Geekbang. https://static001.geekbang.org/resource/image/46/a9/46d283cd82c987153b3fe0c76dfba8a9.jpg.

[4] Building real-time Leaderboard with Redis. https://medium.com/@sandeep4.verma/building-real-time-leaderboard-with-redis-82c98aa47b9f.

[5] Build a real-time gaming leaderboard with Amazon ElastiCache for Redis. https://aws.amazon.com/blogs/database/building-a-real-time-gaming-leaderboard-with-amazon-elasticache-for-redis.

[6] How we created a real-time Leaderboard for a million Users. https://levelup.gitconnected.com/how-we-created-a-real-time-leaderboard-for-a-million-users-555aaa3cef7b.

[7] Leaderboards. https://redislabs.com/solutions/use-cases/leaderboards/.

[8] Lambda. https://aws.amazon.com/lambda/.

[9] Google Cloud Functions. https://cloud.google.com/functions.

[10] Azure Functions. https://azure.microsoft.com/en-us/services/functions/.

[11] Info command. https://redis.io/commands/INFO.

[12] Why redis cluster only have 16384 slots. https://stackoverflow.com/questions/3620532/why-redis-cluster-only-have-16384-slots.

[13] Cyclic redundancy check. https://en.wikipedia.org/wiki/Cyclic_redundancy_check.

[14] Choosing your node size. https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/nodes-select-size.html.

[15] How fast is Redis? https://redis.io/topics/benchmarks.

[16] Using Global Secondary Indexes in DynamoDB. https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html.

[17] Leaderboard & Write Sharding. https://www.dynamodbguide.com/leaderboard-write-sharding/.
