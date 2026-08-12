---
title: Deep-Learning-Based Inverse-Designed Millimeter-Wave Passives and Power Amplifiers
citation: IEEE Journal of Solid-State Circuits
status: done
updated: 2026-08-12
tags:
  - inverse-design
  - rfic
  - deep-learning
card: Uniplanar 구조에서 binary pixel 기반 형상의 최적화 방법론을 소개하기 위한 논문 리뷰. CNN 기반으로 Forward 모델을 설계했으며, 최적화는 Genetic Algorithm 사용
---
### Topology 관점 Review

## 서론
- ![[Pasted image 20260810150403.png]]
- EM topology가 제한된 상황에서 고전적인 inverse design을 진행 했을 때, 모든 공간을 Searching 하는 것이 아니기 때문에 달성 가능한 회로 성능을 제한
- Nanophotonics에서 제안 된 Top-down 방식의 inverse design은 직관적이지 않은 구조로부터 기존 topology의 한계를 뛰어 넘을 수 있음
- Forward 모델의 경우 복잡한 EM 시뮬레이션 과정을 CNN surrogate model을 통해서 예측하는 연구들도 존재하며, 최적화 알고리즘 자체를 Generative adversarial model(GAN) 신경망을 사용한 사례도 존재
- 본 연구는 시뮬레이션 단순화한 상태에서 학습을 진행한 후, 유전체 적층과 같은 복잡한 구조에 대한 학습을 Transfer Learning 형태로 학습시키면서 더 빠른 학습 모델 생성을 달성. 구체적인 탐구안은 아래와 같음
	- Planar 구조에서 Scattering parameter를 예측하는 CNN 모델
	- Transfer learning을 통한 모델 재가용성
	- Forward model(CNN)과 Genertic algorithm(GA)를 통한 정합과정

## Deep CNN by EM Emulator
- ![[Pasted image 20260810153507.png]]
- Planar 구조를 16x16 pixel로 배치하여 binary state를 구성
- 300×300 μm의 uniplanar 영역을 16×16으로 이산화하며, 각 pixel의 metal 유무가 topology를 결정
- 16x16 cell 외각에 VDD 2개, Port1, 2를 위한 edge 성분을 만들며, 임의로 선정할 수 있도록 자유도 주입
	- PA feed, output feed, 상·하단 VDD 위치도 각각 16개 후보 중에서 함께 탐색
	- 전체 탐색 공간은 pixel state와 feed 위치를 합쳐 $2^{256}\times16^4$
- CNN 구조
	- ![[Pasted image 20260810154954.png]]
	- Output은 확인하고자 하는 주파수의 S parameter의 실/허수 값들을 사용하므로 2D matrix 형태 (N_freq x N_Sparameter)의 형태를 갖음
- 데이터 셋 생성 및 증강 방안
	- ![[Pasted image 20260810155225.png]]
	- Augmentation 방식을 적용해서 데이터 셋 증폭을 야기
	- 한 시뮬레이션에서 VDD 위치는 상관 없이 모든 포트의 S parameter를 뽑을 수 있으므로 여러 데이터 생성 가능
- Transfer Learning
	- ![[Pasted image 20260810155350.png]]
	- 유전체를 제외한 금속으로 EM full wave 시뮬레이션을 진행해서 대량의 데이터 확보. 이를 통해 Scratch 학습 진행
	- 이후, 유전체가 반영된 모델에 대한 시뮬레이션 데이터 확보. Scratch model로부터 Transfer learning 진행
	- Scale down 혹은 scale  up에 대해서도 같은 방식으로 Transfer learning 진행
- Pixel 수가 증가하면 표현 가능한 topology는 많아지지만, 학습 데이터와 시뮬레이션 비용도 함께 증가하므로 본 논문에서는 16×16을 사용
- 학습 모델은 Training/Test set에 대한 RMSE 차이가 margin 안으로 들어가는 layer 선택
	- ![[Pasted image 20260810161416.png]]
	- Layer setting
		- ![[Pasted image 20260812133041.png]]
- 실험 결과
	- 시뮬레이션 데이터의 빈도로 인해 일부 정확도가 떨어짐 (S11 30GHz 부근 데이터 중 매칭이 좋은 데이터가 드묾)
		- ![[Pasted image 20260810161710.png]]
	- EM simulator by CNN vs Full wave simulation
		- 실제 시뮬레이션 데이터와 비교해서 S parameter 측면에서 큰 차이가 없는 것을 확인 할 수 있음
			- ![[Pasted image 20260810170658.png|525]]
## PA와 CNN model을 이용한 inverse design
- 앞서 matching network만을 설계하는 것과 달리 PA 특성과같이 결합하여 Output matching network(OMN) 설계
- Inverse design의 대상은 PA 전체 topology가 아니라 OMN이며, 2-stage common-base PA cell의 topology는 고정
-  Inverse design에서 Tandem 방식의 network 방식도 언급했지만 GA 기반으로 최종 선택
- 전체 탐색 과정
	1. GA가 binary pixel map과 port/VDD 위치를 생성
	2. CNN emulator가 각 구조의 S-parameter를 예측
	3. PA의 target load와 insertion loss를 반영한 cost로 구조를 평가한 뒤 GA population을 갱신
- Cost function은 아래와 같음

$$
\sum_{i=1}^{N}
a_1(i)\times\left|Z_L(i)-Z_{\mathrm{Opt}}(i)\right|
+a_2(i)\times\left[1-\left|s_{21}(i)\right|\right]^2
\tag{1}
$$

- $a_1(i)$와 $a_2(i)$는 주파수별 가중치이며, $Z_L(i)$과 $Z_{\mathrm{Opt}}(i)$의 차이는 impedance mismatch를 나타냄
- $\left[1-\left|s_{21}(i)\right|\right]^2$ 항은 insertion loss를 반영
- 구조적인 제약 조건
	- PA port와 VDD 사이에 DC path가 없는 topology에는 penalty를 부여
	- DC blocking을 위한 MIM capacitor 값도 pixel topology와 함께 최적화
- ![[Pasted image 20260812133006.png]]
