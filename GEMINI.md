# Diretrizes de Memória Permanente do ReVídeo AI (Aurora)

Este documento contém as regras invioláveis de inteligência artificial e engenharia de prompts do ReVídeo AI. Devem ser seguidas em todas as sessões e modificações do projeto.

---

## 1. O VÍDEO DE REFERÊNCIA DITA OS CENÁRIOS/LOCAIS E AS AÇÕES
- **Fonte da Verdade:** O vídeo de referência do concorrente é a fonte absoluta da verdade para enquadramentos, ritmo, ações, sequência e, crucialmente, **cenários/locais de gravação**.
- **Proibição de Cenário Fixo Artificial:** É expressamente proibido forçar todas as cenas/imagens no mesmo cômodo ou estúdio genérico se o vídeo original transita por ambientes diferentes.
- **Progressão Fiel:**
  - Se no vídeo de referência na primeira cena a pessoa está no supermercado pegando o produto, a Imagem 1 DEVE ser no supermercado pegando o produto.
  - Se na cena seguinte a pessoa vai para o topo de um prédio (rooftop), a imagem seguinte DEVE ser no topo do prédio.
  - Se depois vai para um sítio montada a cavalo, a imagem seguinte DEVE ser no sítio montada a cavalo.
  - Se depois passa para a cozinha, mesa de jantar, quarto, rua ou loja, as imagens subsequentes DEVEM seguir rigorosamente essa progressão.
- **Amostragem Completa de Frames:** A análise visual de IA DEVE utilizar quadros-chave distribuídos estrategicamente por TODA a duração temporal do vídeo (`selectRepresentativeKeyframes`), nunca apenas os primeiros segundos.

---

## 2. REGRA ABSOLUTA DE CONSISTÊNCIA DO MODELO & ANTI-VIOLAÇÃO DE ROSTO NO TIKTOK
- **Modelo com Foto Fornecida pelo Usuário:** Se o usuário anexou a foto do modelo/criador, utilizar estritamente a pessoa da foto com máxima fidelidade.
- **Modelo Automático (Sem Foto Fornecida - Regra Anti-Violação TikTok):**
  - Quando o usuário NÃO fornecer foto de modelo e a IA for gerar um modelo baseado no vídeo de referência:
    * É **ESTRITAMENTE PROIBIDO** clonar ou replicar o rosto exato da pessoa do vídeo de referência concorrente.
    * Deve-se gerar um modelo com características similares (mesma faixa etária, estilo/vibe comercial, como um primo/parente), **PORÉM COM UM ROSTO DIFERENTE**.
    * Alterar traços faciais, formato de olhos/nariz/queixo, e aplicar variações no cabelo (estilo, comprimento, tom) ou tom de pele para que seja nitidamente uma outra pessoa real e evite punições de direitos autorais, imagem ou plágio no TikTok.
- **Trava de Identidade Humana do Início ao Fim:** É **ESTRITAMENTE PROIBIDO** trocar ou alternar o modelo entre as imagens de um mesmo vídeo.
  - O novo modelo concebido na primeira imagem DEVE continuar exatamente o mesmo na Imagem 1, 2, 3, 4, 5, 6 e em todas as imagens geradas.
  - Se for um casal, o **MESMO CASAL** permanece em todas.
  - O que muda de imagem para imagem é o **CENÁRIO/LOCAL** e a **AÇÃO** física. A pessoa/modelo é rigorosamente imutável durante o vídeo.
- **Enquadramento do Modelo:** Se o vídeo de referência adotar enquadramento do pescoço para baixo (`neck_down`), ocultar o rosto e focar nas mãos/tronco. Se mostrar o rosto (`show_face`), manter identidade facial fiel à imagem âncora gerada.

---

## 3. DINÂMICA DE 3 IMAGENS POR CENA (8s / 10s)
- Cada bloco de geração de cena do Google Veo 3.1 (8s ou 10s) utiliza **3 imagens de referência** correspondentes a momentos cronológicos do corte (aprox. 2.5s a 3.3s por imagem).
- Cena 1: Imagem 1, Imagem 2, Imagem 3.
- Cena 2: Imagem 4, Imagem 5, Imagem 6.
- Cada imagem possui seus metadados próprios: `location`, `actionDescription`, `role` e `targetAngle`.

---

## 4. CONTINUIDADE TEMPORAL E TRATAMENTO DE ÁUDIO / FALA ENTRE CENAS
- **Regra Absoluta para Vídeos com Música / Trilha Sonora (Mesmo com Vocal/Letra):**
  - Quando o vídeo concorrente usar música de fundo ou trilha sonora (mesmo que contenha letras cantadas, trap, rap, funk ou rimas):
    * É **ESTRITAMENTE PROIBIDO** usar a letra da música como roteiro de fala do criativo!
    * O campo `adaptedScript` e o `sceneSpeech` de **TODAS as cenas (Cena 1, Cena 2, etc.)** DEVEM VIR RIGOROSAMENTE EM BRANCO (`""`) por padrão.
    * Os prompts do Veo devem ser formatados exclusivamente para som ambiente / trilha sonora sem falas artificiais.
    * O campo de fala da cena só é preenchido se o próprio usuário decidir digitar ou adicionar voluntariamente.
- **Linha do Tempo Contínua:** Cena 1, Cena 2, etc., são partes consecutivas do mesmo vídeo. A Cena 2 nunca reinicia o vídeo nem repete poses da Cena 1.
- **Divisão Estrita de Locução (Quando Houver Locução Comercial Real):** Cada cena recebe exclusivamente o trecho de áudio/fala correspondente ao seu intervalo de tempo (`sceneSpeech`). A Cena 2 nunca repete a fala da Cena 1.
- **Call to Action (CTA):** Chamadas para ação de compra pertencem exclusivamente à última cena do vídeo.

---

## 5. FIDELIDADE FÍSICA AO PRODUTO REAL (1:1)
- O produto real das fotos do usuário não pode ser redesenhado, simplificado ou substituído.
- Geometria, proporções, materiais, cores, texturas, costuras, solados, rótulos e logos devem ser preservados com fidelidade microscópica.
- Zero textos ou legendas digitais na fotografia bruta (raw 9:16).

---

## 6. REGRA ABSOLUTA DE CONEXÃO: PESSOAS BRASILEIRAS SIMPLES & CASAS AUTÊNTICAS DO DIA A DIA
- **Pessoas Reais e Simples do Cotidiano:** Quando for retratada uma pessoa (seja homem ou mulher) sem foto prévia fornecida pelo usuário:
  * Deve ser uma **pessoa brasileira simples e comum do dia a dia** (rosto natural, traços genuínos, aparência simpática e acessível).
  * Não forçar padrões inatingíveis de supermodelos de passarela ou produções plásticas irreais. Pessoas reais e autênticas geram muito mais conexão, empatia e conversão no TikTok.
- **Cenários de Casa Simples Brasileira (Proibido Casas Chiques / Instagramáveis Irreais):**
  * Quando o cenário do vídeo for em casa (sala, quarto, cozinha, quintal, varanda, banheiro ou área de serviço):
    - O ambiente DEVE ser a **casa de uma pessoa comum brasileira simples** (decoração aconchegante e realista do dia a dia, móveis normais de famílias brasileiras).
    - É **ESTRITAMENTE PROIBIDO** gerar mansões luxuosas, casas chiques, lofts cinematográficos hiper-instagramáveis ou arquitetura europeia/americana que fuja da realidade da maioria dos compradores brasileiros.
- **Lojas e Ambientes Comerciais:** Quando a cena for em loja, shopping ou comércio, o ambiente pode ser limpo e organizado, mantendo o realismo comercial sem ostentação desmedida.

---

## 7. REGRA ABSOLUTA: PROIBIÇÃO TOTAL DE TATUAGENS
- É **ESTRITAMENTE PROIBIDO** gerar tatuagens no modelo ou na modelo (seja mulher ou homem).
- A pele do modelo deve ser sempre limpa, natural e sem qualquer desenho, escrita, símbolo ou tinta corporal (tattoos) nos braços, pernas, mãos, pescoço, tórax ou costas.
- Essa regra é inviolável em todos os modos do aplicativo (Modo Ania e Modo Clonagem).

---

## 8. REGRA DO MODO ANIA: 3 IMAGENS NA MESMA MODELO EM CORES DIFERENTES
- **Mesma Modelo e Mesmo Enquadramento:** As 3 imagens geradas no Modo Ania DEVEM conter rigorosamente a **mesma modelo** (mesmo corpo, mesmo tom de pele, mesma pose frontal e mesmo quarto simples de casa brasileira).
- **Sem Rosto (Pescoço para Baixo):** Enquadramento estritamente do pescoço para baixo, sem mostrar o rosto em nenhuma das 3 imagens.
- **Cores Diferentes da Mesma Peça:**
  - Se o usuário anexar 3 cores (Cor 1, Cor 2 e Cor 3), cada uma das 3 imagens DEVE ser gerada na cor correspondente (Imagem 1 na Cor 1, Imagem 2 na Cor 2 e Imagem 3 na Cor 3).
  - É **ESTRITAMENTE PROIBIDO** gerar imagens repetindo a mesma cor se foram fornecidas 3 cores diferentes.
  - Apenas se o produto tiver apenas 1 ou 2 cores anexadas é permitido repetir a cor para preencher as 3 imagens.

