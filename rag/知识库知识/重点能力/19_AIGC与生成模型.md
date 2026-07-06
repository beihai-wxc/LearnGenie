# AIGC 与生成模型

> 关键词：AIGC, GAN, 扩散模型, Stable Diffusion, ControlNet, Sora, 生成式AI, VAE, StyleGAN

## 生成式 AI 的发展脉络

**AIGC（AI Generated Content，人工智能生成内容）** 指利用人工智能自动生成文本、图像、音频、视频、代码等内容的技术与产物。其发展脉络大致可分为三个阶段：

1. **规则与模板阶段（2010 前）**：基于模板的文本生成、马尔可夫链、隐马尔可夫模型语音合成
2. **深度生成模型阶段（2014–2020）**：GAN、VAE、Normalizing Flow、自回归模型相继出现，能生成逼真图像与语音
3. **大规模预训练阶段（2020 至今）**：扩散模型在图像生成取得突破；Transformer 类大模型（GPT、Stable Diffusion、Sora）实现跨模态高质量生成，AIGC 进入大规模商用

AIGC 已成为内容创作的关键生产力工具，覆盖文生图、文生视频、文生音乐、文生代码等众多方向，正在重塑创意、营销、教育、娱乐等行业。

## GAN 系列

### GAN 基本原理

**GAN（Generative Adversarial Network，生成对抗网络）** 由 Ian Goodfellow 于 2014 年提出，核心思想是通过生成器（Generator）与判别器（Discriminator）的博弈学习数据分布。生成器试图将随机噪声映射为逼真样本，判别器试图区分真实样本与生成样本。

```python
# GAN 训练循环简化伪代码
import torch
import torch.nn as nn
import torch.nn.functional as F

def train_gan(generator, discriminator, dataloader, optim_g, optim_d, z_dim, epochs=100):
    bce = nn.BCEWithLogitsLoss()
    for epoch in range(epochs):
        for real_imgs in dataloader:
            batch_size = real_imgs.size(0)
            real_labels = torch.ones(batch_size, 1)
            fake_labels = torch.zeros(batch_size, 1)

            # --- 训练判别器 ---
            z = torch.randn(batch_size, z_dim)
            fake_imgs = generator(z).detach()
            d_loss = (bce(discriminator(real_imgs), real_labels) +
                      bce(discriminator(fake_imgs), fake_labels)) / 2
            optim_d.zero_grad(); d_loss.backward(); optim_d.step()

            # --- 训练生成器 ---
            z = torch.randn(batch_size, z_dim)
            fake_imgs = generator(z)
            g_loss = bce(discriminator(fake_imgs), real_labels)  # 欺骗判别器
            optim_g.zero_grad(); g_loss.backward(); optim_g.step()
```

### DCGAN

**DCGAN（Deep Convolutional GAN）** 将卷积网络引入 GAN，使用转置卷积进行上采样、批归一化稳定训练，首次实现高质量图像生成。

### StyleGAN

**StyleGAN** 由 NVIDIA 提出，引入 **风格映射网络（Mapping Network）** 与 **AdaIN（Adaptive Instance Normalization）**，将潜变量分离为不同层级的风格，实现细粒度属性控制（如姿态、发型、肤色可独立调整）。StyleGAN2、StyleGAN3 进一步改善伪影与纹理粘连问题，是人脸生成的工业标准。

### CycleGAN

**CycleGAN** 解决无配对数据的图像到图像翻译问题，通过 **循环一致性损失（Cycle Consistency Loss）** 保证内容保留，实现马↔斑马、夏↔冬、莫奈画作↔照片等风格转换。

```python
# CycleGAN 循环一致性损失
def cycle_loss(G_F, G_B, x, y, lambda_cyc=10.0):
    reconstructed_x = G_B(G_F(x))
    reconstructed_y = G_F(G_B(y))
    return lambda_cyc * (F.l1_loss(reconstructed_x, x) +
                         F.l1_loss(reconstructed_y, y))
```

### GAN 系列对比

| 模型 | 关键创新 | 主要应用 | 局限 |
|------|---------|---------|------|
| GAN | 对抗训练 | 图像生成 | 训练不稳定、模式崩溃 |
| DCGAN | 卷积架构 | 自然图像 | 分辨率有限 |
| StyleGAN | 风格解耦 | 人脸编辑 | 训练数据需求大 |
| CycleGAN | 循环一致性 | 风格迁移 | 难处理大几何变化 |

## VAE 与扩散模型

### VAE（变分自编码器）

**VAE（Variational Autoencoder）** 通过变分推断学习数据的潜在分布。编码器输出潜变量的均值与方差，解码器从采样的潜变量重构输入。VAE 优化 ELBO（证据下界），训练稳定、可显式建模概率分布，但生成图像常偏模糊。

### 扩散模型（Diffusion Models）

**扩散模型** 的核心思想包含两个过程：
- **前向过程（Forward Process）**：逐步向数据添加高斯噪声，最终变为纯噪声
- **反向过程（Reverse Process）**：学习一个神经网络逆向去噪，从噪声还原出数据

扩散模型理论严谨、训练稳定、生成质量超越 GAN，是当前主流的生成范式。DDPM（Denoising Diffusion Probabilistic Models）是其奠基性工作。

```python
# DDPM 训练与采样伪代码
import torch

class DDPM:
    def __init__(self, T=1000, beta_start=1e-4, beta_end=0.02):
        self.T = T
        self.betas = torch.linspace(beta_start, beta_end, T)
        self.alphas = 1 - self.betas
        self.alpha_bars = torch.cumprod(self.alphas, dim=0)

    def q_sample(self, x0, t, noise=None):
        """前向加噪"""
        if noise is None:
            noise = torch.randn_like(x0)
        sqrt_ab = self.alpha_bars[t].sqrt().view(-1, 1, 1, 1)
        sqrt_1mab = (1 - self.alpha_bars[t]).sqrt().view(-1, 1, 1, 1)
        return sqrt_ab * x0 + sqrt_1mab * noise, noise

    def train_step(self, model, x0):
        t = torch.randint(0, self.T, (x0.size(0),))
        xt, noise = self.q_sample(x0, t)
        pred_noise = model(xt, t)
        return F.mse_loss(pred_noise, noise)

    @torch.no_grad()
    def sample(self, model, shape):
        x = torch.randn(shape)
        for t in reversed(range(self.T)):
            z = torch.randn(shape) if t > 0 else 0
            beta_t = self.betas[t]
            mean = (1 / self.alphas[t].sqrt()) * (x - (beta_t / (1 - self.alpha_bars[t]).sqrt()) * model(x, torch.tensor([t])))
            x = mean + beta_t.sqrt() * z
        return x
```

## Stable Diffusion 架构解析

**Stable Diffusion（SD）** 由 Stability AI 与 CompVis 团队提出，是开源文生图的里程碑。其核心创新在于 **潜在扩散（Latent Diffusion）**：不在像素空间做扩散，而在 VAE 压缩后的潜在空间进行，大幅降低计算成本。

架构组成：

1. **VAE 编码器**：将图像压缩到 4×64×64 的潜在表示
2. **U-Net**：在潜在空间进行迭代去噪，输入含噪声的 latent、时间步与文本条件
3. **文本编码器（CLIP Text Encoder）**：将 prompt 编码为条件向量，通过 Cross-Attention 注入 U-Net
4. **VAE 解码器**：将去噪后的 latent 解码回像素图像

```python
# Stable Diffusion 推理流程简化伪代码
def stable_diffusion_inference(prompt, unet, vae, text_encoder, scheduler, num_steps=50):
    # 1. 文本编码
    text_emb = text_encoder(prompt)              # [1, 77, 768]
    # 2. 随机初始化 latent
    latent = torch.randn(1, 4, 64, 64)
    # 3. 迭代去噪
    scheduler.set_timesteps(num_steps)
    for t in scheduler.timesteps:
        noise_pred = unet(latent, t, encoder_hidden_states=text_emb)
        latent = scheduler.step(noise_pred, t, latent).prev_sample
    # 4. 解码回像素
    image = vae.decode(latent / 0.18215)
    return image
```

## 文本到图像生成流程

完整的文生图系统通常包含：

1. **Prompt 解析与增强**：用户输入 → 标准化提示词（可叠加风格词、负面提示）
2. **文本编码**：CLIP/T5 将提示编码为条件向量
3. **潜在扩散采样**：U-Net 去噪，CFG（Classifier-Free Guidance）平衡文本相关性与多样性
4. **高分辨率放大**：Latent Upscaling 或 Super-Resolution 提升分辨率
5. **后处理**：面部修复（CodeFormer）、超分、安全过滤

```python
# Classifier-Free Guidance 公式
def cfg_noise_pred(unet, latent, t, text_emb, uncond_emb, guidance_scale=7.5):
    noise_uncond = unet(latent, t, uncond_emb)
    noise_cond   = unet(latent, t, text_emb)
    return noise_uncond + guidance_scale * (noise_cond - noise_uncond)
```

## 条件控制（ControlNet、IP-Adapter）

### ControlNet

**ControlNet** 由 Lvmin Zhang 提出，通过为 U-Net 添加一个可训练的副本（带零卷积连接），引入结构化条件（如边缘、深度图、骨架、法线图），实现对生成图像空间结构的精确控制。

```python
# ControlNet 简化结构
class ControlNet(nn.Module):
    def __init__(self, unet):
        super().__init__()
        self.unet_copy = copy.deepcopy(unet)  # 可训练副本
        self.zero_conv = nn.Conv2d(320, 320, 1)
        # zero_conv 初始权重为 0，保证训练初始等价于原 SD
        nn.init.zeros_(self.zero_conv.weight)
        nn.init.zeros_(self.zero_conv.bias)

    def forward(self, latent, t, text_emb, control_image_feat):
        # 在副本中注入条件图特征
        return self.zero_conv(self.unet_copy(latent, t, text_emb, control_image_feat))
```

常见 ControlNet 类型：Canny 边缘、HED 边缘、OpenPose 骨架、Depth 深度、Scribble 涂鸦、Segmentation 分割图。

### IP-Adapter

**IP-Adapter** 实现图像 prompt 的轻量化注入，将参考图像的视觉特征作为额外的 Cross-Attention 输入，支持风格迁移、角色一致性生成，参数量小、即插即用。

## 视频生成

### Sora

**Sora** 由 OpenAI 于 2024 年发布，基于 **DiT（Diffusion Transformer）** 架构，将视频压缩为时空 patch token，进行扩散建模。Sora 能生成长达 1 分钟的高保真视频，展现出对物理世界初步的模拟能力，被视为"世界模拟器"的雏形。

### Kling（可灵）

**Kling** 是快手推出的国产视频生成模型，在长视频、复杂运动、物理一致性方面表现优异，支持文生视频、图生视频、视频续写。

### Runway Gen-3

**Runway Gen-3 Alpha** 在电影级画面质量、镜头控制方面表现突出，是商业视频生成的代表产品。

视频生成对比：

| 模型 | 架构 | 最大时长 | 物理一致性 | 主要优势 |
|------|------|---------|----------|---------|
| Sora | DiT | ~60s | 较强 | 世界模拟潜力 |
| Kling | Diffusion+ | ~2min | 强 | 长视频、运动自然 |
| Runway Gen-3 | DiT 变体 | ~10s | 中 | 画质电影感 |
| Pika | Diffusion | ~3s | 中 | 编辑能力强 |

## 音乐与语音生成

- **音乐生成**：Suno、Udio 实现端到端的歌词+旋律+人声合成；MusicGen、Jasco 等开源模型基于 Transformer 与音频 codec
- **语音克隆与 TTS**：VITS、NaturalSpeech、Bark、ChatTTS 等实现高自然度语音合成与零样本克隆
- **音频 codec**：EnCodec、SoundStream 将音频离散化为 token，支撑音频自回归生成

## AIGC 版权与伦理

AIGC 高速发展同时带来多重伦理挑战：

1. **版权争议**：训练数据使用受版权保护作品的合法性（如 Getty Images 起诉 Stable Diffusion）
2. **深度伪造（Deepfake）**：换脸、语音克隆用于诈骗、诽谤、政治操纵
3. **身份与肖像权**：未经授权使用名人或普通人的形象
4. **偏见与歧视**：训练数据偏见被放大，生成刻板印象
5. **就业冲击**：插画师、配音、翻译等岗位受冲击
6. **内容标识**：监管要求 AI 生成内容显式或隐式标识

应对策略包括：合规训练数据、内容水印（如 SynthID）、深度伪造检测、AIGC 标识法规（中国《深度合成管理规定》要求显著标识）、创作者收益分享机制等。

## 总结

AIGC 已从研究原型发展为重要生产力。技术脉络上，GAN 主导了 2014–2020 的图像生成，扩散模型在 2022 后全面超越 GAN，Stable Diffusion 推动开源生态，ControlNet 等条件控制技术让生成可控、可用，Sora 等视频生成模型展示了迈向"世界模型"的可能。未来 AIGC 将向更高保真、更强可控、多模态统一方向发展，同时需要建立与之匹配的版权、伦理、安全治理体系，让生成式 AI 真正服务于社会福祉。
