# Diretrizes de Memória dos Agentes — ReVídeo AI (Aurora)

## Regras Fundamentais e Invioláveis de Comportamento

### 1. Cenários e Locais Ditados Pelo Vídeo de Referência
- O vídeo de referência é quem dita as cenas e cenários.
- Se o vídeo original transita entre diferentes locais (ex: supermercado -> topo de prédio -> sítio montada a cavalo -> cozinha -> quarto), as imagens geradas para o produto do usuário DEVEM transitar exatamente por esses mesmos locais.
- Nunca confine todas as imagens no mesmo quarto ou estúdio genérico.
- A amostragem de frames cobre toda a extensão temporal do vídeo (`selectRepresentativeKeyframes`).

### 2. Consistência Absoluta do Modelo & Anti-Violação de Rosto no TikTok
- **Com Foto do Modelo:** Se o usuário forneceu a foto do modelo, usar estritamente essa pessoa com máxima fidelidade.
- **Sem Foto do Modelo (Anti-Violação TikTok):** É ESTRITAMENTE PROIBIDO clonar o rosto exato do modelo do vídeo de referência concorrente. Gerar um modelo com perfil similar (mesma faixa etária/vibe, como um primo), PORÉM COM ROSTO DIFERENTE (traços faciais distintos, variação de cabelo/tom de pele) para evitar violações e punições no TikTok.
- **Consistência do Início ao Fim:** É terminantemente proibido trocar de modelo entre as imagens geradas. O novo modelo concebido na primeira imagem (ou da foto enviada) permanece rigorosamente o mesmo em 100% das imagens geradas (Imagem 1 a 6). O que muda de imagem para imagem é o CENÁRIO (local) e a AÇÃO física; o MODELO é rigorosamente o mesmo.

### 3. Estrutura de Storyboard e Cenas
- 3 imagens geradas por cena de 8s/10s (cortes dinâmicos de 2.5s a 3.3s).
- Cada imagem possui `location`, `actionDescription`, `role` e `targetAngle`.
- Linha do tempo sequencial sem reinício ou repetição de ações.
- Locução/fala estritamente particionada (`sceneSpeech` sem repetição entre cenas).
- **Vídeos com Música:** Quando for música/trilha sonora (mesmo com vocal/letra), `sceneSpeech` de TODAS as cenas DEVE FICAR EM BRANCO (`""`) por padrão. NUNCA usar letras de música como fala comercial.
- CTA exclusivo da última cena.

### 4. Fidelidade 1:1 ao Produto do Usuário
- Máxima fidelidade física: cores, materiais, geometrias, solados/embalagens e logos idênticos às fotos reais enviadas pelo usuário.

### 5. Pessoas Brasileiras Simples & Casas Típicas e Autênticas
- **Pessoas do Cotidiano:** Retratar pessoas brasileiras comuns e simples do dia a dia (homens ou mulheres com aparência natural, acessível e simpática, sem estética inalcançável de supermodelo).
- **Casas Simples:** Quando for em ambiente residencial (sala, quarto, cozinha, etc.), retratar a casa de uma pessoa brasileira simples e comum. Proibido mansões, casas chiques ou decorações hiper-instagramáveis que fujam da realidade popular brasileira.
- **Lojas:** Lojas e comércios podem ser organizados e limpos, mantendo naturalidade comercial.

### 6. Proibição Total de Tatuagens
- Nunca gerar tatuagens no modelo ou na modelo (homem ou mulher). A pele deve ser sempre 100% limpa, natural e sem qualquer tinta, desenho ou tatuagem.

### 7. Modo Ania: 3 Imagens na Mesma Modelo em Cores Diferentes
- **Mesma Modelo e Mesmo Enquadramento:** As 3 imagens do Modo Ania mantêm rigorosamente a mesma modelo, mesma pose, mesmo quarto e enquadramento vertical 9:16 do pescoço para baixo (sem rosto).
- **3 Cores Distintas:** Se fornecidas 3 cores, cada imagem retrata uma cor diferente da mesma peça (Cor 1, Cor 2 e Cor 3). Proibido repetir cor se houver 3 cores anexadas. Repetições só ocorrem se o usuário anexar apenas 1 ou 2 cores.

