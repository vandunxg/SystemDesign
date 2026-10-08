# Chương 05: Thiết kế consistent hashing


Để horizontal scaling khả thi, việc phân phối request/dữ liệu hiệu quả và đồng đều giữa các server là rất quan trọng. Consistent hashing là một kỹ thuật phổ biến để đạt được mục tiêu này. Nhưng trước hết, hãy cùng tìm hiểu sâu hơn về vấn đề.

#### Vấn đề rehashing

Nếu có n cache server, một cách phổ biến để cân bằng tải là dùng hàm hash sau:

$$serverIndex = hash(key) \bmod N$$, trong đó N là kích thước server pool

Hãy dùng một ví dụ để xem cách này hoạt động. Như trong Bảng 5-1, chúng ta có 4 server cùng 8 string key và giá trị hash tương ứng.

![](images/chapter5/table5-1.jpg)

Để xác định server lưu trữ key, chúng ta thực hiện phép modulo $$f(key) \bmod 4$$. Ví dụ, $$hash(key0) \bmod 4 = 1$$ có nghĩa là client phải liên hệ với server 1 để lấy dữ liệu trong cache. Hình 5-1 cho thấy cách các key trong Bảng 5-1 được phân phối.

![](images/chapter5/figure5-1.jpg)

Khi kích thước server pool cố định và dữ liệu được phân phối đồng đều, phương pháp này hoạt động rất tốt. Tuy nhiên, vấn đề xuất hiện khi thêm server mới hoặc xóa server hiện có.

Ví dụ, nếu server 1 offline, kích thước server pool sẽ còn 3. Dùng cùng hàm hash, chúng ta vẫn nhận được cùng các giá trị hash của key. Tuy nhiên, khi thực hiện phép modulo, chúng ta nhận được các server index khác, vì số lượng server đã giảm 1. Kết quả khi áp dụng $$hash \bmod 3$$ được thể hiện trong Bảng 5-2:

![](images/chapter5/table5-2.jpg)

Hình 5-2 cho thấy cách phân phối key mới dựa trên Bảng 5-2.

![](images/chapter5/figure5-2.jpg)

Như Hình 5-2 cho thấy, phần lớn key bị phân phối lại, không chỉ các key ban đầu được lưu trên server offline (server 1). Điều này có nghĩa là khi server 1 offline, phần lớn client cache sẽ kết nối đến sai server để lấy dữ liệu, gây ra một cơn bão cache miss. Consistent hashing là một kỹ thuật hiệu quả để giảm nhẹ vấn đề này.

#### Consistent hashing

Trích từ Wikipedia: “Consistent hashing là một dạng hash đặc biệt. Khi thay đổi kích thước hash table và dùng consistent hashing, trung bình chỉ cần remap $$k/n$$ key, trong đó $$k$$ là số lượng key và $$n$$ là số lượng slot. Ngược lại, trong hầu hết hash table truyền thống, việc thay đổi số lượng slot của array khiến gần như tất cả key bị remap \[1]”

#### Hash space và hash ring

Giờ chúng ta đã hiểu định nghĩa của consistent hashing, hãy xem nó hoạt động như thế nào. Giả sử dùng `SHA-1` làm hàm hash `f`, output của hàm hash có phạm vi: $$x_0,x_1,x_2,x_3,...,x_n$$. Trong mật mã học, hash space của `SHA-1` chạy từ $$0$$ đến $$2^{160} – 1$$. Nói cách khác, $$x_0$$ tương ứng với $$0$$, $$x_n$$ tương ứng với $$2^{160} – 1$$, còn tất cả giá trị hash khác nằm giữa $$0$$ và $$2^{160} – 1$$. Hình 5-3 minh họa hash space.

![](images/chapter5/figure5-3.jpg)

Nối hai đầu lại với nhau, chúng ta có một hash ring như trong Hình 5-4:

![](images/chapter5/figure5-4.jpg)

#### Hash server

Dùng cùng hàm hash f, chúng ta map server lên ring dựa trên IP hoặc tên của server. Hình 5-5 cho thấy 4 server được map lên hash ring.

![](images/chapter5/figure5-5.jpg)

#### Hash key

Cần lưu ý rằng hàm hash dùng ở đây khác với hàm hash trong “rehashing problem” và không có phép modulo. Như Hình 5-6 minh họa, 4 cache key (key0, key1, key2, key3) được hash lên hash ring.

![](images/chapter5/figure5-6.jpg)

#### Tìm server

Để xác định key được lưu trên server nào, chúng ta tìm theo chiều kim đồng hồ từ vị trí của key trên ring cho đến khi gặp một server. Hình 5-7 giải thích quá trình này. Tìm theo chiều kim đồng hồ, `key0` được lưu trên `server0`; `key1` được lưu trên `server1`; `key2` được lưu trên `server2`; `key3` được lưu trên `server3`.

![](images/chapter5/figure5-7.jpg)

#### Thêm server

Với logic trên, khi thêm một server mới, chúng ta chỉ cần phân phối lại một phần key.

Trong Hình 5-8, sau khi thêm `server4`, chỉ cần phân phối lại `key0`. k1, k2 và k3 vẫn nằm trên các server cũ. Hãy xem kỹ logic này: trước khi `server4` được thêm vào, `key0` nằm trên `server0`. Bây giờ `key0` sẽ nằm trên `server4`, vì `server4` là `server` đầu tiên gặp được khi đi theo chiều kim đồng hồ từ vị trí của `key0` trên ring. Theo thuật toán consistent hashing, các key khác không bị phân phối lại.

![](images/chapter5/figure5-8.jpg)

#### Xóa server

Khi một server bị xóa, chỉ một phần nhỏ key cần được phân phối lại bằng consistent hashing. Trong Hình 5-9, khi `server1` bị xóa, chỉ `key1` phải được remap sang server2. Các key còn lại không bị ảnh hưởng.

![](images/chapter5/figure5-9.jpg)

#### Hai vấn đề của phương pháp cơ bản

Thuật toán consistent hashing được đề xuất bởi Karger và các cộng sự tại MIT \[1].


Các bước cơ bản như sau:

1. Dùng hàm hash phân phối đồng đều để map server và key lên ring.
2. Để biết một key được map đến server nào, tìm theo chiều kim đồng hồ từ vị trí của key cho đến khi gặp server đầu tiên trên ring.

Phương pháp này có hai vấn đề:

1.  Trước hết, do server có thể được thêm vào hoặc xóa đi, **không thể duy trì kích thước partition bằng nhau cho tất cả server trên ring**. Partition là hash space giữa hai server liền kề. Kích thước partition trên ring được gán cho mỗi server có thể rất nhỏ hoặc rất lớn. Trong Hình 5-10, nếu xóa s1, partition của s2 (được đánh dấu bằng mũi tên hai chiều) lớn gấp đôi partition của s0 và s3.

    ![](images/chapter5/figure5-10.jpg)
2.  Thứ hai, key có thể được phân phối không đồng đều trên ring. Ví dụ, nếu các server được map vào những vị trí như trong Hình 5-11, phần lớn key sẽ được lưu trên `server2`. Trong khi đó, `server1` và `server3` không có dữ liệu.

    ![](images/chapter5/figure5-11.jpg)

**Một kỹ thuật gọi là virtual node hoặc replica được dùng để giải quyết các vấn đề này**

#### Virtual node

Virtual node là các node logic, trong đó mỗi server được biểu diễn bởi nhiều virtual node trên ring. Trong Hình 5-12, server0 và server1 đều có 3 virtual node. 3 là một lựa chọn tùy ý; trong các hệ thống thực tế, số lượng virtual node lớn hơn nhiều. Thay vì dùng s0, chúng ta dùng s0\_0, s0\_1 và s0\_2 để đại diện cho server0 trên ring. Tương tự, s1\_0, s1\_1 và s1\_2 đại diện cho server1 trên ring. Nhờ virtual node, mỗi server phụ trách nhiều partition. Các partition có nhãn s0 (các cạnh) do server0 quản lý. Ngược lại, các partition có nhãn s1 do server1 quản lý.

![](images/chapter5/figure5-12.jpg)

Để tìm server lưu trữ key, chúng ta đi theo chiều kim đồng hồ từ vị trí của key và tìm virtual node đầu tiên gặp được trên ring. Trong Hình 5-13, để tìm server lưu trữ k0, chúng ta đi theo chiều kim đồng hồ từ vị trí của k0 và gặp virtual node s1\_1, đây chính là server1.

![](images/chapter5/figure5-13.jpg)

Khi số lượng virtual node tăng, key được phân phối đồng đều hơn. Đó là vì khi số lượng virtual node tăng, độ lệch chuẩn giảm, dẫn đến dữ liệu được phân phối đều hơn. Độ lệch chuẩn đo mức độ phân tán của dữ liệu. Kết quả của một nghiên cứu trực tuyến \[2] cho thấy với một đến hai trăm virtual node, độ lệch chuẩn nằm trong khoảng từ 5% giá trị trung bình (200 virtual node) đến 10% giá trị trung bình (100 virtual node). Khi tăng số lượng virtual node, độ lệch chuẩn sẽ nhỏ hơn. Tuy nhiên, cần nhiều storage hơn để lưu dữ liệu về các virtual node. Đây là một trade-off; chúng ta có thể điều chỉnh số lượng virtual node để đáp ứng yêu cầu của hệ thống.

#### Tìm các key bị ảnh hưởng

Khi một server được thêm vào hoặc xóa đi, một phần dữ liệu cần được phân phối lại. Làm thế nào để tìm phạm vi bị ảnh hưởng và phân phối lại dữ liệu?

Trong Hình 5-14, Server 4 được thêm vào ring. Phạm vi bị ảnh hưởng bắt đầu từ s4 (node mới được thêm) và di chuyển ngược chiều kim đồng hồ trên ring cho đến khi gặp một server (s3). Vì vậy, các key nằm giữa s3 và s4 cần được phân phối lại cho s4.

![](images/chapter5/figure5-14.jpg)

Như Hình 5-15 minh họa, khi một server (s1) bị xóa, phạm vi bị ảnh hưởng bắt đầu từ s1 (node bị xóa) và di chuyển ngược chiều kim đồng hồ trên ring cho đến khi gặp một server (s0). Vì vậy, các key nằm giữa s0 và s1 phải được phân phối lại cho s2.

![](images/chapter5/figure5-15.jpg)

#### Tóm tắt

Trong chương này, chúng ta đã tìm hiểu sâu về consistent hashing, bao gồm lý do cần dùng nó và cách nó hoạt động.

Các lợi ích của consistent hashing gồm:

* Khi server được thêm vào hoặc xóa đi, chỉ một phần nhỏ key bị phân phối lại.
* Dễ dàng horizontal scaling vì dữ liệu được phân phối đồng đều hơn.
* Giảm nhẹ vấn đề hot key. Việc truy cập quá mức vào một shard cụ thể có thể khiến server quá tải. Hãy tưởng tượng dữ liệu của Katy Perry, Justin Bieber và Lady Gaga cuối cùng đều nằm trên cùng một shard. Consistent hashing giảm nhẹ vấn đề này bằng cách phân phối dữ liệu đồng đều hơn.

Consistent hashing được sử dụng rộng rãi trong các hệ thống thực tế, bao gồm một số hệ thống nổi tiếng:

* Thành phần partition của database Amazon Dynamo \[3]
* Phân vùng dữ liệu giữa các cluster trong Apache Cassandra \[4]
* Ứng dụng chat Discord \[5]
* Content Delivery Network của Akamai \[6]
* Network load balancer Maglev \[7]

Chúc mừng bạn đã đi đến đây! Hãy tự động viên mình một chút, làm tốt lắm!

#### Tài liệu tham khảo

\[1] Consistent hashing: <https://en.wikipedia.org/wiki/Consistent_hashing>

\[2] Consistent Hashing:

<https://tom-e-white.com/2007/11/consistent-hashing.html>

\[3] Dynamo: Amazon’s Highly Available Key-value Store:

<https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf>

\[4] Cassandra - A Decentralized Structured Storage System:

<http://www.cs.cornell.edu/Projects/ladis2009/papers/Lakshman-ladis2009.PDF>

\[5] How Discord Scaled Elixir to 5,000,000 Concurrent Users:

<https://blog.discord.com/scaling-elixir-f9b8e1e7c29b>

\[6] CS168: The Modern Algorithmic Toolbox Lecture #1: Introduction and Consistent Hashing:

<http://theory.stanford.edu/~tim/s16/l/l1.pdf>

\[7] Maglev: A Fast and Reliable Software Network Load Balancer:

<https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44824.pdf>
