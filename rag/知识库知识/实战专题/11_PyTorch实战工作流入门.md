# PyTorch 实战工作流入门

> PyTorch 是当前深度学习领域最主流的框架，掌握其完整工作流是进行AI研究和开发的基础。本指南从零开始，覆盖从张量操作到生产级训练的完整流程。

---

## 一、PyTorch 安装与环境配置

### 1.1 安装指南

```bash
# 基础安装（CPU）
pip install torch torchvision

# CUDA 11.8 安装
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1 安装
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# 验证安装
python -c "import torch; print(torch.__version__); print(torch.cuda.is_available())"
```

### 1.2 Conda环境管理（推荐）

```bash
# 创建独立环境
conda create -n pytorch_env python=3.10
conda activate pytorch_env

# 安装PyTorch（conda方式，自动处理CUDA依赖）
conda install pytorch torchvision pytorch-cuda=12.1 -c pytorch -c nvidia

# 常用配套包
pip install tensorboard    # 训练可视化
pip install tqdm           # 进度条
pip install scikit-learn   # 评估指标
pip install matplotlib     # 绘图
pip install einops         # 张量操作简化
```

### 1.3 框架对比

| 框架 | 定位 | 图类型 | 调试 | 部署 | 社区 |
|------|------|--------|------|------|------|
| **PyTorch** | 科研首选 | 动态图 | 容易 | TorchScript/ONNX | 学术界主流 |
| **TensorFlow** | 工业部署 | 静态图(2.x兼容动态) | 较难 | TF Serving/TF Lite | 工业界主流 |
| **JAX** | 高性能计算 | 函数式 | 中等 | XLA | 前沿研究 |
| **PaddlePaddle** | 国产框架 | 动态图 | 容易 | Paddle Inference | 国内工业界 |

### 1.4 可复现性设置

```python
import torch
import numpy as np
import random

def seed_everything(seed=42):
    """固定所有随机种子，确保实验可复现"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True  # 牺牲一些速度换取确定性
    torch.backends.cudnn.benchmark = False      # 关闭自动优化

seed_everything(42)
```

---

## 二、张量（Tensor）详解

张量是PyTorch的核心数据结构，支持GPU加速和自动求导。

### 2.1 张量创建

```python
import torch
import numpy as np

# 从Python数据创建
x = torch.tensor([1, 2, 3], dtype=torch.float32)  # 指定数据类型

# 创建特定形状
x_zeros = torch.zeros(3, 4)           # 全0
x_ones = torch.ones(3, 4)             # 全1
x_rand = torch.randn(3, 4)            # 标准正态分布
x_range = torch.arange(0, 10, 2)      # 等差序列 [0,2,4,6,8]
x_linspace = torch.linspace(0, 1, 5)  # 等间隔 [0, 0.25, 0.5, 0.75, 1]
x_eye = torch.eye(3)                  # 单位矩阵
x_full = torch.full((2, 3), 7.0)     # 填充特定值

# 从NumPy转换（共享内存！）
np_array = np.array([1, 2, 3])
x_from_np = torch.from_numpy(np_array)  # NumPy → Tensor
x_to_np = x_from_np.numpy()             # Tensor → NumPy

# 从另一个张量
x_like = torch.randn_like(x_zeros)      # 相同形状的随机张量
```

### 2.2 张量属性

```python
x = torch.randn(2, 3, 4)

print(x.shape)          # torch.Size([2, 3, 4])
print(x.size())         # torch.Size([2, 3, 4])
print(x.dim())          # 3（维度数）
print(x.dtype)          # torch.float32
print(x.device)         # cpu 或 cuda:0
print(x.requires_grad)  # 是否需要梯度
print(x.numel())        # 24（总元素数）
```

### 2.3 张量运算

```python
# 算术运算
x = torch.tensor([1.0, 2.0, 3.0])
y = torch.tensor([4.0, 5.0, 6.0])

z1 = x + y              # 逐元素加 [5,7,9]
z2 = x * y              # 逐元素乘 [4,10,18]
z3 = x ** 2             # 逐元素平方 [1,4,9]
z4 = torch.dot(x, y)   # 点积 32

# 矩阵运算
A = torch.randn(3, 4)
B = torch.randn(4, 5)
C = A @ B               # 矩阵乘法 (3,5) — 推荐
C = torch.matmul(A, B)  # 等价写法

# 聚合运算
x = torch.randn(3, 4)
x.sum()          # 标量
x.sum(dim=0)     # 沿第0维求和 → (4,)
x.mean(dim=1)    # 沿第1维求均值 → (3,)
x.max(dim=1)     # 返回(值, 索引)
x.argmax(dim=1)  # 返回最大值的索引

# 形状操作
x = torch.randn(2, 3, 4)
x_reshape = x.reshape(6, 4)    # 重塑（可共用内存）
x_view = x.view(6, 4)          # 视图（必须连续）
x_permute = x.permute(2, 0, 1) # 维度交换 → (4,2,3)
x_transpose = x.transpose(0, 1) # 交换两个维度
x_squeeze = x.unsqueeze(0)      # 增加维度 → (1,2,3,4)
x_squeeze = x_squeeze.squeeze(0) # 移除大小为1的维度

# 广播（Broadcasting）
a = torch.ones(3, 1)   # (3, 1)
b = torch.ones(1, 4)   # (1, 4)
c = a + b               # 自动广播为 (3, 4)
```

### 2.4 GPU 操作

```python
# 检查GPU
print(torch.cuda.is_available())
print(torch.cuda.device_count())
print(torch.cuda.get_device_name(0))

# 设备选择
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 张量移到GPU
x = torch.randn(3, 4)
x = x.to(device)              # 移到GPU
x = x.cuda()                  # 简写（如果有GPU）
x = x.cpu()                   # 移回CPU

# 创建时指定设备
x = torch.randn(3, 4, device=device)

# 多GPU
model = torch.nn.DataParallel(model)  # 数据并行
```

---

## 三、自动求导（Autograd）

### 3.1 基本使用

```python
# 创建需要梯度的张量
x = torch.tensor([2.0, 3.0], requires_grad=True)

# 前向计算
y = x ** 2       # y = [4, 9]
z = y.sum()      # z = 13

# 反向传播
z.backward()

# 查看梯度
print(x.grad)    # tensor([4., 6.]) = dz/dx = 2x

# 为什么是[4, 6]?
# dz/dx₁ = dz/dy₁ * dy₁/dx₁ = 1 * 2*2 = 4
# dz/dx₂ = dz/dy₂ * dy₂/dx₂ = 1 * 2*3 = 6
```

### 3.2 关键注意事项

```python
# 1. 梯度累积！每次backward会在grad上累加
x = torch.tensor([2.0, 3.0], requires_grad=True)
for _ in range(3):
    y = (x ** 2).sum()
    y.backward()
    print(x.grad)  # [4,6] → [8,12] → [12,18]  # 累积了！
    
# 解决：每次backward前清零
x.grad.zero_()

# 2. 禁用梯度（推理时使用）
with torch.no_grad():
    output = model(input)  # 不计算梯度，节省内存

# 3. detach()：分离张量与计算图
x = torch.randn(3, requires_grad=True)
y = x * 2
z = y.detach()  # z不再追踪梯度

# 4. item()：将标量张量转为Python数值
loss = criterion(output, target)
loss_value = loss.item()  # 转为float
```

---

## 四、数据集与数据加载器

### 4.1 自定义 Dataset

```python
from torch.utils.data import Dataset, DataLoader

class CustomDataset(Dataset):
    """自定义数据集模板"""
    def __init__(self, features, labels, transform=None):
        self.features = features
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.features)
    
    def __getitem__(self, idx):
        x = self.features[idx]
        y = self.labels[idx]
        
        if self.transform:
            x = self.transform(x)
        
        return x, y

# 使用
dataset = CustomDataset(X_train, y_train)
```

### 4.2 图像数据集

```python
from torchvision import datasets, transforms

# 数据增强Pipeline
train_transform = transforms.Compose([
    transforms.Resize(256),                    # 缩放
    transforms.RandomCrop(224),                 # 随机裁剪
    transforms.RandomHorizontalFlip(p=0.5),    # 随机水平翻转
    transforms.ColorJitter(                    # 颜色抖动
        brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1
    ),
    transforms.RandomRotation(10),             # 随机旋转
    transforms.ToTensor(),                     # 转为张量
    transforms.Normalize(                      # 归一化
        mean=[0.485, 0.456, 0.406], 
        std=[0.229, 0.224, 0.225]
    )
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# 加载数据集
train_dataset = datasets.CIFAR10(
    root='./data', train=True, download=True, transform=train_transform
)
```

### 4.3 DataLoader 详解

```python
train_loader = DataLoader(
    train_dataset,
    batch_size=64,         # 批量大小
    shuffle=True,          # 训练集打乱
    num_workers=4,         # 多进程加载（Windows下建议0）
    pin_memory=True,       # 加速CPU→GPU传输
    drop_last=False,       # 是否丢弃最后不完整的batch
    persistent_workers=True # 保持worker进程存活
)

# 迭代数据
for batch_idx, (data, target) in enumerate(train_loader):
    data, target = data.to(device), target.to(device)
    # 训练代码...

# 获取一个batch
first_batch = next(iter(train_loader))
print(f"数据形状: {first_batch[0].shape}")  # (64, 3, 224, 224)
print(f"标签形状: {first_batch[1].shape}")  # (64,)
```

---

## 五、构建神经网络

### 5.1 使用 nn.Module（推荐）

```python
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(SimpleNet, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(hidden_dim, output_dim)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        return x

model = SimpleNet(784, 256, 10)
```

### 5.2 常用网络层

| 层 | 类名 | 说明 |
|------|------|------|
| **全连接** | `nn.Linear(in, out)` | y = Wx + b |
| **卷积** | `nn.Conv2d(in_c, out_c, kernel)` | 2D卷积 |
| **池化** | `nn.MaxPool2d(kernel)` | 最大池化 |
| **批归一化** | `nn.BatchNorm1d/2d` | 批归一化 |
| **Dropout** | `nn.Dropout(p)` | 随机失活 |
| **嵌入** | `nn.Embedding(num, dim)` | 词嵌入 |
| **LSTM** | `nn.LSTM(input, hidden)` | LSTM层 |
| **Transformer** | `nn.TransformerEncoder` | Transformer编码器 |

### 5.3 CNN模型示例（图像分类）

```python
class SimpleCNN(nn.Module):
    """轻量级CNN，适用于CIFAR-10等小图像"""
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            # Block 1: 3 → 32
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 32x32 → 16x16
            nn.Dropout2d(0.25),
            
            # Block 2: 32 → 64
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 16x16 → 8x8
            nn.Dropout2d(0.25),
            
            # Block 3: 64 → 128
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 8x8 → 4x4
            nn.Dropout2d(0.25),
        )
        self.classifier = nn.Sequential(
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)  # 展平
        x = self.classifier(x)
        return x


class ResidualBlock(nn.Module):
    """ResNet残差块"""
    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, 
                               stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3,
                               stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        
        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )
    
    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)  # 残差连接
        out = F.relu(out)
        return out


class ResNet18(nn.Module):
    """简化版ResNet-18"""
    def __init__(self, num_classes=10):
        super().__init__()
        self.in_channels = 64
        
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        
        self.layer1 = self._make_layer(64, 2, stride=1)
        self.layer2 = self._make_layer(128, 2, stride=2)
        self.layer3 = self._make_layer(256, 2, stride=2)
        self.layer4 = self._make_layer(512, 2, stride=2)
        
        self.avg_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512, num_classes)
    
    def _make_layer(self, out_channels, num_blocks, stride):
        strides = [stride] + [1] * (num_blocks - 1)
        layers = []
        for s in strides:
            layers.append(ResidualBlock(self.in_channels, out_channels, s))
            self.in_channels = out_channels
        return nn.Sequential(*layers)
    
    def forward(self, x):
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.avg_pool(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x
```

### 5.4 迁移学习

迁移学习是深度学习最重要的实践技巧之一——使用预训练模型微调，大幅减少训练数据和时间：

```python
import torchvision.models as models

# ===== 方法1：特征提取（冻结预训练层）=====
# 适用：小数据集（< 1K样本），只训练最后的分类头

# 加载预训练模型
model_ft = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结所有参数
for param in model_ft.parameters():
    param.requires_grad = False

# 替换最后的全连接层
num_features = model_ft.fc.in_features
model_ft.fc = nn.Linear(num_features, num_classes)  # 只训练这一层

# 只有fc层的参数会被更新
optimizer = torch.optim.Adam(model_ft.fc.parameters(), lr=0.001)


# ===== 方法2：微调（解冻部分或全部层）=====
# 适用：中等数据集（1K-10K样本），调整预训练权重

model_ft2 = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
model_ft2.fc = nn.Linear(model_ft2.fc.in_features, num_classes)

# 分层学习率：底层用小lr，顶层用大lr
optimizer = torch.optim.Adam([
    {'params': model_ft2.layer1.parameters(), 'lr': 1e-5},  # 浅层：小lr
    {'params': model_ft2.layer2.parameters(), 'lr': 1e-5},
    {'params': model_ft2.layer3.parameters(), 'lr': 5e-5},
    {'params': model_ft2.layer4.parameters(), 'lr': 1e-4},
    {'params': model_ft2.fc.parameters(), 'lr': 1e-3},       # 分类头：大lr
], lr=1e-3)


# ===== 方法3：渐进式解冻 =====
# 适用：大数据集，避免破坏预训练特征

# 阶段1：只训练fc（1-2个epoch）
# 阶段2：解冻layer4，训练2-3个epoch
# 阶段3：解冻layer3，继续训练
# ...逐步解冻更多层

def gradual_unfreeze(model, epoch, unfreeze_schedule):
    """
    渐进式解冻
    unfreeze_schedule: {epoch_num: [layer_names_to_unfreeze]}
    """
    if epoch in unfreeze_schedule:
        for name, param in model.named_parameters():
            for layer_name in unfreeze_schedule[epoch]:
                if layer_name in name:
                    param.requires_grad = True
                    print(f"Unfreezing: {name}")
```

**迁移学习最佳实践**：

| 场景 | 数据量 | 方法 | 学习率 | 训练轮数 |
|------|--------|------|--------|---------|
| **小数据+相似任务** | < 1K | 特征提取 | 1e-3 | 10-20 |
| **小数据+不同任务** | < 1K | 特征提取+中间层 | 1e-3 / 1e-4 | 20-30 |
| **中数据+相似任务** | 1K-10K | 微调 | 1e-4 | 10-20 |
| **中数据+不同任务** | 1K-10K | 渐进式解冻 | 1e-4 → 1e-5 | 20-50 |
| **大数据** | > 10K | 从头训练或全量微调 | 1e-4 | 50-100 |

### 5.5 模型信息查看

```python
# 打印模型结构
print(model)

# 统计参数量
total_params = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"总参数量: {total_params:,}")
print(f"可训练参数量: {trainable_params:,}")

# 查看各层参数
for name, param in model.named_parameters():
    print(f"{name}: {param.shape}")
```

---

## 六、训练完整流程

### 6.1 标准训练循环

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 超参数
config = {
    'learning_rate': 0.001,
    'batch_size': 64,
    'num_epochs': 20,
    'weight_decay': 1e-4,
}

# 1. 准备数据
train_loader = DataLoader(train_dataset, batch_size=config['batch_size'], shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=config['batch_size'], shuffle=False)

# 2. 创建模型
model = SimpleNet(784, 256, 10).to(device)

# 3. 定义损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=config['learning_rate'], 
                       weight_decay=config['weight_decay'])

# 4. 学习率调度器
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=config['num_epochs'])

# 5. 训练循环
best_val_acc = 0.0
patience_counter = 0
patience = 5

for epoch in range(config['num_epochs']):
    # === 训练阶段 ===
    model.train()
    train_loss = 0.0
    train_correct = 0
    train_total = 0
    
    for batch_X, batch_y in train_loader:
        batch_X, batch_y = batch_X.to(device), batch_y.to(device)
        
        # 前向传播
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        
        # 反向传播
        optimizer.zero_grad()  # 清空梯度
        loss.backward()        # 计算梯度
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)  # 梯度裁剪
        optimizer.step()       # 更新参数
        
        # 统计
        train_loss += loss.item() * batch_X.size(0)
        _, predicted = outputs.max(1)
        train_total += batch_y.size(0)
        train_correct += predicted.eq(batch_y).sum().item()
    
    train_loss /= train_total
    train_acc = 100. * train_correct / train_total
    
    # === 验证阶段 ===
    model.eval()
    val_loss = 0.0
    val_correct = 0
    val_total = 0
    
    with torch.no_grad():
        for batch_X, batch_y in val_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            
            val_loss += loss.item() * batch_X.size(0)
            _, predicted = outputs.max(1)
            val_total += batch_y.size(0)
            val_correct += predicted.eq(batch_y).sum().item()
    
    val_loss /= val_total
    val_acc = 100. * val_correct / val_total
    
    # 学习率调度
    scheduler.step()
    
    # Early Stopping
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        patience_counter = 0
        torch.save(model.state_dict(), 'best_model.pth')
    else:
        patience_counter += 1
        if patience_counter >= patience:
            print(f"Early stopping at epoch {epoch+1}")
            break
    
    print(f"Epoch {epoch+1}/{config['num_epochs']} | "
          f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
          f"Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}% | "
          f"LR: {scheduler.get_last_lr()[0]:.6f}")
```

---

## 七、混合精度训练

```python
from torch.cuda.amp import GradScaler, autocast

scaler = GradScaler()  # 梯度缩放器

for batch_X, batch_y in train_loader:
    batch_X, batch_y = batch_X.to(device), batch_y.to(device)
    
    optimizer.zero_grad()
    
    # 前向传播使用FP16
    with autocast():
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
    
    # 反向传播（自动缩放）
    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    scaler.step(optimizer)
    scaler.update()
```

**混合精度训练原理：**

```
为什么混合精度能加速？

传统FP32训练：
  前向传播: FP32矩阵乘法 → FP32结果
  反向传播: FP32梯度计算 → FP32参数更新
  显存占用: 每个参数4字节 × N

混合精度训练：
  前向传播: FP16矩阵乘法 → FP16结果（速度翻倍）
  反向传播: FP16梯度计算 → FP32参数更新（精度保证）
  显存占用: 激活值减半，参数仍FP32

  关键：参数主副本保持FP32（master weights），
  每步将FP32权重转为FP16做前向，梯度用FP16计算后转回FP32更新
  
  GradScaler的作用：
  FP16的梯度可能下溢（太小变0），scaler将loss乘以一个大数，
  使梯度放大到FP16可表示范围，更新前再缩回来。
```

---

## 八、分布式训练

### 8.1 DataParallel vs DistributedDataParallel

```
DataParallel (DP):
  单进程多线程 → 简单但有GIL瓶颈
  GPU 0 负责收集/分发 → 负载不均衡
  适合：快速验证、单机多卡

DistributedDataParallel (DDP):
  多进程 → 无GIL瓶颈
  每个GPU独立进程 → 负载均衡
  Ring-AllReduce通信 → 高效
  适合：生产训练、多机多卡
```

### 8.2 DDP 训练脚本

```python
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler

def setup_ddp():
    """初始化DDP"""
    dist.init_process_group(backend="nccl")
    local_rank = int(os.environ["LOCAL_RANK"])
    torch.cuda.set_device(local_rank)
    return local_rank

def main():
    local_rank = setup_ddp()
    device = torch.device(f"cuda:{local_rank}")
    
    # 模型包装
    model = SimpleNet(784, 256, 10).to(device)
    model = DDP(model, device_ids=[local_rank])
    
    # 数据分片（每个进程只看到部分数据）
    train_sampler = DistributedSampler(train_dataset)
    train_loader = DataLoader(
        train_dataset,
        batch_size=64,
        sampler=train_sampler,  # 替代shuffle
        num_workers=4,
        pin_memory=True,
    )
    
    for epoch in range(num_epochs):
        train_sampler.set_epoch(epoch)  # 确保每个epoch数据打乱不同
        for batch_X, batch_y in train_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            # 正常训练...
    
    dist.destroy_process_group()

# 启动命令：
# torchrun --nproc_per_node=4 train_ddp.py  （4卡训练）
# torchrun --nproc_per_node=2 --nnodes=2 --node_rank=0 --master_addr=xxx train_ddp.py  （2机2卡）
```

### 8.3 梯度累积（显存不足时的技巧）

```python
# 当batch_size=32但显存只够batch_size=8时
accumulation_steps = 4  # 累积4步 = 等效batch_size=32

optimizer.zero_grad()
for i, (batch_X, batch_y) in enumerate(train_loader):
    outputs = model(batch_X)
    loss = criterion(outputs, batch_y) / accumulation_steps  # 注意除以累积步数
    loss.backward()  # 梯度累积
    
    if (i + 1) % accumulation_steps == 0:
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        optimizer.zero_grad()
```

---

## 八、模型保存与加载

```python
# 方式1：仅保存参数（推荐）
torch.save(model.state_dict(), 'model_params.pth')
model = SimpleNet(784, 256, 10)
model.load_state_dict(torch.load('model_params.pth', weights_only=True))

# 方式2：保存完整checkpoint
checkpoint = {
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'scheduler_state_dict': scheduler.state_dict(),
    'best_val_acc': best_val_acc,
}
torch.save(checkpoint, 'checkpoint.pth')

# 加载checkpoint
checkpoint = torch.load('checkpoint.pth')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
start_epoch = checkpoint['epoch'] + 1
```

---

## 九、TensorBoard 可视化

```python
from torch.utils.tensorboard import SummaryWriter

writer = SummaryWriter('runs/experiment_1')

# 记录损失
writer.add_scalar('Loss/train', train_loss, epoch)
writer.add_scalar('Loss/val', val_loss, epoch)

# 记录准确率
writer.add_scalar('Accuracy/train', train_acc, epoch)
writer.add_scalar('Accuracy/val', val_acc, epoch)

# 记录学习率
writer.add_scalar('Learning_rate', optimizer.param_groups[0]['lr'], epoch)

# 记录模型图
writer.add_graph(model, input_sample)

# 记录图像
writer.add_images('sample_images', images, epoch)

# 记录直方图（观察参数分布）
for name, param in model.named_parameters():
    writer.add_histogram(name, param, epoch)

# 记录嵌入（高维向量可视化）
writer.add_embedding(features, metadata=labels, label_img=images)

writer.close()

# 启动TensorBoard
# tensorboard --logdir=runs
```

### 实验管理最佳实践

```python
# 多实验对比：每次实验用不同的子目录
writer = SummaryWriter(f'runs/lr_{lr}_bs_{batch_size}_epoch_{epochs}')

# 同时对比多个实验
# tensorboard --logdir=runs  ← 自动加载runs/下所有子目录
```

---

## 十、高级调试技巧

### 10.1 梯度检查

```python
# 验证自定义层的梯度是否正确
from torch.autograd import gradcheck

class MyCustomLayer(nn.Module):
    def forward(self, x):
        return x * torch.sigmoid(x)  # Swish激活

layer = MyCustomLayer()
x = torch.randn(10, requires_grad=True, dtype=torch.float64)  # 必须用float64

# gradcheck会用数值梯度验证自动梯度
result = gradcheck(layer, x, eps=1e-6, atol=1e-4)
print(f"梯度检查: {'通过' if result else '失败'}")
```

### 10.2 常见训练问题排查

```
问题1: Loss不下降
  检查清单：
  □ 学习率是否合适？（试试1e-3或1e-4）
  □ 数据是否正确加载？（打印一个batch看看）
  □ 标签是否正确？（分类任务检查标签范围）
  □ 梯度是否正常？（打印梯度范数）
  □ 是否忘记optimizer.step()？

问题2: Loss为NaN
  检查清单：
  □ 学习率是否太大？（降低10倍）
  □ 数据是否有NaN/Inf？（np.isnan检查）
  □ 是否除以零？（加epsilon）
  □ log操作是否输入负数？（加clamp）
  □ 混合精度是否下溢？（检查GradScaler）

问题3: 训练很慢
  检查清单：
  □ 是否使用了DataLoader的num_workers？
  □ 是否使用了pin_memory=True？
  □ 是否使用了混合精度训练？
  □ 是否有频繁的CPU-GPU数据传输？
  □ 是否在每个batch都做了不必要的计算？
```

```python
# 梯度监控工具
def monitor_gradients(model):
    """监控模型各层的梯度统计"""
    for name, param in model.named_parameters():
        if param.grad is not None:
            grad_norm = param.grad.norm().item()
            grad_mean = param.grad.mean().item()
            grad_std = param.grad.std().item()
            if grad_norm > 100 or grad_norm < 1e-7:
                print(f"⚠️ {name}: grad_norm={grad_norm:.6f} "
                      f"mean={grad_mean:.6f} std={grad_std:.6f}")
            # 检查NaN
            if torch.isnan(param.grad).any():
                print(f"🚨 {name}: 梯度包含NaN!")

# 在训练循环中调用
loss.backward()
monitor_gradients(model)
optimizer.step()
```

### 10.3 PyTorch Profiler 性能分析

```python
from torch.profiler import profile, record_function, ProfilerActivity

# 分析CPU和GPU操作
with profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
             profile_memory=True, record_shapes=True) as prof:
    with record_function("model_inference"):
        output = model(input_data)

# 打印耗时最多的操作
print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=10))

# 导出可视化（在Chrome浏览器查看 chrome://tracing）
prof.export_chrome_trace("trace.json")

# 常见性能瓶颈：
# 1. CPU→GPU数据传输过多 → 增大batch、pin_memory
# 2. 某个算子特别慢 → 检查是否有更快的实现
# 3. GPU利用率低 → 可能被CPU数据加载阻塞
```

---

## 十一、模型保存与加载

```python
# 方式1：仅保存参数（推荐）
torch.save(model.state_dict(), 'model_params.pth')
model = SimpleNet(784, 256, 10)
model.load_state_dict(torch.load('model_params.pth', weights_only=True))

# 方式2：保存完整checkpoint（支持断点续训）
checkpoint = {
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'scheduler_state_dict': scheduler.state_dict(),
    'best_val_acc': best_val_acc,
    'config': config,  # 保存超参数
}
torch.save(checkpoint, 'checkpoint.pth')

# 加载checkpoint恢复训练
checkpoint = torch.load('checkpoint.pth')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
start_epoch = checkpoint['epoch'] + 1
best_val_acc = checkpoint['best_val_acc']
```

---

## 十二、项目组织最佳实践

```
project/
├── config.py          # 超参数配置
├── data/
│   ├── dataset.py      # 自定义Dataset
│   └── preprocess.py  # 数据预处理
├── models/
│   └── model.py        # 模型定义
├── utils/
│   ├── metrics.py      # 评估指标
│   └── utils.py        # 工具函数
├── train.py            # 训练脚本
├── evaluate.py         # 评估脚本
├── inference.py        # 推理脚本
├── requirements.txt    # 依赖
└── README.md           # 说明文档
```

### 超参数配置

```python
from dataclasses import dataclass

@dataclass
class Config:
    # 数据
    data_path: str = "./data"
    batch_size: int = 64
    num_workers: int = 4
    
    # 模型
    input_dim: int = 784
    hidden_dim: int = 256
    output_dim: int = 10
    
    # 训练
    learning_rate: float = 1e-3
    weight_decay: float = 1e-4
    num_epochs: int = 50
    patience: int = 5
    grad_clip: float = 1.0
    
    # 设备
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    seed: int = 42
    
    def seed_everything(self):
        torch.manual_seed(self.seed)
        np.random.seed(self.seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(self.seed)
```

---

## 十三、调试技巧

### 13.1 过拟合/欠拟合诊断

| 现象 | 训练损失 | 验证损失 | 诊断 | 解决方案 |
|------|---------|---------|------|---------|
| **欠拟合** | 高 | 高 | 模型太简单 | 增加容量、减少正则化 |
| **过拟合** | 低 | 高 | 模型太复杂 | 增加正则化、数据增强 |
| **训练失败** | 不下降 | — | 学习率/数据问题 | 降低lr、检查数据 |
| **震荡** | 震荡 | 震荡 | lr太大 | 降低lr、增大batch |

### 13.2 学习率选择

```python
# 学习率查找器（简化版）
def find_lr(model, train_loader, criterion, device, init_lr=1e-7, final_lr=10, n_steps=100):
    optimizer = optim.SGD(model.parameters(), lr=init_lr)
    lr_mult = (final_lr / init_lr) ** (1 / n_steps)
    
    lrs = []
    losses = []
    
    for i, (x, y) in enumerate(train_loader):
        if i >= n_steps:
            break
        
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        output = model(x)
        loss = criterion(output, y)
        loss.backward()
        optimizer.step()
        
        lrs.append(optimizer.param_groups[0]['lr'])
        losses.append(loss.item())
        optimizer.param_groups[0]['lr'] *= lr_mult
    
    return lrs, losses

# 使用方法：绘制lr vs loss曲线，选择loss下降最快处的lr
```

---

## 十四、HuggingFace Transformers 集成

PyTorch 在 NLP/LLM 领域通常与 HuggingFace Transformers 配合使用：

```python
from transformers import AutoModelForSequenceClassification, AutoTokenizer, Trainer, TrainingArguments

# 加载预训练模型
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-chinese",
    num_labels=2
)
tokenizer = AutoTokenizer.from_pretrained("bert-base-chinese")

# 数据预处理
def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=512)

tokenized_datasets = dataset.map(tokenize_function, batched=True)

# 训练配置
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    learning_rate=2e-5,
    weight_decay=0.01,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    fp16=True,                  # 混合精度
    gradient_accumulation_steps=2,
    logging_steps=50,
    report_to="tensorboard",
)

# 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["validation"],
)

trainer.train()

# 推理
from transformers import pipeline
classifier = pipeline("text-classification", model=model, tokenizer=tokenizer)
result = classifier("这个产品非常好用")
print(result)  # [{'label': 'POSITIVE', 'score': 0.98}]
```

---

## 十五、einops——优雅的张量操作

```python
# pip install einops
from einops import rearrange, reduce, repeat

# rearrange: 更直观的张量维度操作
# 将(b, c, h, w)转为(b, h*w, c)
x = torch.randn(2, 3, 224, 224)
y = rearrange(x, 'b c h w -> b (h w) c')  # 比 x.permute(0,2,3,1).reshape(2,-1,3) 更直观

# 将图像分成patch（ViT中使用）
patches = rearrange(x, 'b c (h p1) (w p2) -> b (h w) (p1 p2 c)', p1=16, p2=16)
# (2, 3, 224, 224) → (2, 196, 768)

# reduce: 降维操作
# 全局平均池化
avg = reduce(x, 'b c h w -> b c', 'mean')  # 等价于 x.mean(dim=[2,3])

# repeat: 复制操作
# 将(b, c)扩展为(b, c, h, w)
x_2d = torch.randn(2, 256)
x_4d = repeat(x_2d, 'b c -> b c h w', h=14, w=14)
```

---

> **核心总结**：PyTorch的完整工作流为：环境配置 → 张量操作 → 数据加载 → 模型构建 → 训练循环（含验证、学习率调度、早停）→ 保存加载 → 推理。进阶要点包括：混合精度训练（AMP）、分布式训练（DDP）、梯度累积、梯度裁剪、TensorBoard可视化、Profiler性能分析。对于NLP/LLM任务，HuggingFace Transformers提供了更高层的封装。掌握这套完整流程，就能快速搭建和训练任何深度学习模型，并具备将实验推向生产环境的能力。
