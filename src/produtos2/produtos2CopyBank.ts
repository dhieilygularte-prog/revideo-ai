import {
  CopyArchetype,
  CopyBankEntry,
  Produtos2ClientGender,
  Produtos2Duration,
  Produtos2Influencer,
  Produtos2MaleSubOption,
  Produtos2SubMode,
} from './types';

function normalizeAccents(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gerador aleatório real uniforme (Seção 4.2) usando crypto.getRandomValues
 */
export function pickUniformRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('Lista vazia para sorteio');
  }
  if (items.length === 1) return items[0];
  try {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const idx = array[0] % items.length;
    return items[idx];
  } catch {
    return items[Math.floor(Math.random() * items.length)];
  }
}

/**
 * SEÇÃO 11 — BANCO DE COPIES — PRODUTOS GERAIS
 */
export const COPIES_PRODUTOS_GERAIS: CopyBankEntry[] = [
  // Nicho: Pesca
  {
    id: 'PES-01',
    bank: 'geral',
    niche: 'Pesca',
    productType: 'Vara de pescar',
    keywords: ['vara de pescar', 'vara de pesca', 'vara de carbono', 'vara ultralight', 'molinete', 'carretilha'],
    archetype: 'Achado/Demonstração',
    audience: 'Masculino',
    charCount: 300,
    fits8s: false,
    text: 'Gente, se você pesca, olha a leveza dessa vara de carbono. Ela é ultralight, a ponta dobra com qualquer belisco, mas o carbono aguenta a briga. O cabo em EVA encaixa perfeito na mão, arremesso preciso o dia todo sem cansar o braço. Olha esse detalhe vermelho premium, o preço tá ridículo no carrinho.',
  },
  {
    id: 'PES-02',
    bank: 'geral',
    niche: 'Pesca',
    productType: 'Vara de pescar',
    keywords: ['vara de pescar', 'vara de pesca', 'vara de carbono', 'vara ultralight'],
    archetype: 'Unboxing/Chegou',
    audience: 'Masculino',
    charCount: 277,
    fits8s: false,
    text: 'Gente, finalmente chegou a vara de carbono ultralight que eu tanto queria testar na represa. Olha a flexibilidade e a sensibilidade dessa ponta. Ação rápida, e o cabo de carbono é muito resistente. Leve demais para pescar o dia todo sem cansar o braço. Equipamento sensacional.',
  },
  {
    id: 'PES-03',
    bank: 'geral',
    niche: 'Pesca',
    productType: 'Vara de pescar',
    keywords: ['vara de pescar', 'vara de pesca', 'vara de carbono', 'vara ultralight'],
    archetype: 'Achado/Demonstração',
    audience: 'Masculino',
    charCount: 245,
    fits8s: false,
    text: 'Gente, olha a sensibilidade dessa vara de carbono ultralight que acabou de chegar. Ação sensacional, verga quase no meio sem quebrar e sente até a mordida mais fraca da tilápia. Perfeita para piapara e tilápia. Corre para o link e garante a sua.',
  },
  {
    id: 'PES-04',
    bank: 'geral',
    niche: 'Pesca',
    productType: 'Linha de pesca',
    keywords: ['linha de pesca', 'linha multifilamento', 'linha monofilamento', 'linha fluorocarbono', 'anzol', 'isca artificial'],
    archetype: 'Achado/Demonstração',
    audience: 'Masculino',
    charCount: 231,
    fits8s: false,
    text: 'Gente, o segredo para não espantar os gigantes chegou. Olha isso, ela simplesmente some na água, camuflagem perfeita. E a resistência é absurda, não estraga por nada. Rende muito pra pescaria. Clica no carrinho para garantir a sua.',
  },

  // Nicho: Natação / Esporte aquático
  {
    id: 'NAT-01',
    bank: 'geral',
    niche: 'Natação / Esporte aquático',
    productType: 'Óculos de natação',
    keywords: ['oculos de natacao', 'touca de natacao', 'natacao', 'mergulho'],
    archetype: 'Dor→Solução',
    audience: 'Unissex',
    charCount: 252,
    fits8s: false,
    text: 'Chega de nadar cego e perder protetor de ouvido. Olha isso! O protetor já vem embutido na tira. É impossível perder na água. E o tratamento antiembaçante é surreal. A visão fica cristalina. O fecho de clique rápido não puxa o cabelo. Clica no carrinho.',
  },
  {
    id: 'NAT-02',
    bank: 'geral',
    niche: 'Natação / Esporte aquático',
    productType: 'Óculos de natação',
    keywords: ['oculos de natacao', 'natacao', 'mergulho'],
    archetype: 'Dor→Solução',
    audience: 'Unissex',
    charCount: 229,
    fits8s: false,
    text: 'Fim daquele sufoco de água no olho e lente embaçada. A vedação é perfeita e o protetor de ouvido já vem preso na alça. Lente espelhada com proteção UV, e não embaça de jeito nenhum. Seu nado com muito mais conforto. Vai conferir!',
  },

  // Nicho: Som automotivo
  {
    id: 'SOM-01',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Amplificador automotivo',
    keywords: ['amplificador automotivo', 'modulo amplificador', 'modulo de som', 'amplificador'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 143,
    fits8s: true,
    text: 'Potência e qualidade de som. Esse amplificador automotivo é perfeito para deixar seu som muito mais potente. Clique no link e garanta já o seu.',
  },
  {
    id: 'SOM-02',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Amplificador automotivo',
    keywords: ['amplificador automotivo', 'modulo amplificador', 'modulo de som', 'amplificador'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Masculino',
    charCount: 218,
    fits8s: false,
    text: 'Baixou o preço do amplificador mais vendido aqui do TikTok Shop. Clica no carrinho laranja pra você desbloquear a oferta relâmpago e já finaliza pra você não perder o frete grátis. Mas atenção, é só até meia-noite, tá?',
  },
  {
    id: 'SOM-03',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Alto-falante',
    keywords: ['alto-falante', 'alto falante', 'autofalante', 'subwoofer', 'som automotivo'],
    archetype: 'Achado/Demonstração',
    audience: 'Masculino',
    charCount: 291,
    fits8s: false,
    text: 'A qualidade de som desse alto-falante não combina com esse valor. Ele tem uma carcaça metálica robusta e um cone resistente pra entregar batidas muito potentes. Liga o som no máximo e treme a cabine inteira, som limpo sem distorcer nada. Som de cinema no seu carro. Pega no carrinho laranja.',
  },
  {
    id: 'SOM-04',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Alto-falante',
    keywords: ['alto-falante', 'alto falante', 'autofalante', 'bomber', '6 polegadas'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 145,
    fits8s: true,
    text: 'Quer dar um upgrade no som do seu carro? Conheça o Bomber BBX de 6 polegadas. São 130 watts RMS de pura potência. Clique no link e garanta o seu.',
  },
  {
    id: 'SOM-05',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Alto-falante (kit)',
    keywords: ['kit alto-falante', 'kit alto falante', 'kit 4 alto-falantes', 'bravox'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 138,
    fits8s: true,
    text: 'Quer transformar o som do seu carro? Esse kit Bravox já vem com 4 alto-falantes e entrega aquele upgrade que faz diferença. Garanta o seu!',
  },
  {
    id: 'SOM-06',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Alto-falante',
    keywords: ['alto-falante', 'alto falante', 'autofalante', '8 polegadas', 'medio grave', 'subwoofer'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 210,
    fits8s: false,
    text: 'Olha esse alto-falante de 8 polegadas, o design é absurdo. Com 600 watts, veja só a força, conjunto magnético duplo e os terminais banhados a ouro. Vamos instalar essa fera na caixa, o grave vai ser monstruoso.',
  },
  {
    id: 'SOM-07',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Alto-falante (kit)',
    keywords: ['kit alto-falante', 'kit alto falante', 'hurricane', 'kit 4 alto'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 140,
    fits8s: true,
    text: 'Olha esse kit com 4 alto-falantes Hurricane de 6 polegadas. São 240 W de potência máxima no conjunto, com tweeter integrado. Venha conferir!',
  },
  {
    id: 'SOM-08',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Alto-falante',
    keywords: ['alto-falante', 'alto falante', 'autofalante', 'jbl', 'triaxial'],
    archetype: 'Unboxing/Chegou',
    audience: 'Masculino',
    charCount: 207,
    fits8s: false,
    text: 'Olha esse unboxing. Esse é o triaxial da JBL. Olha só o design e o acabamento. São 80 W RMS em cada falante. Perfeito para as portas do seu carro. Esse par garante som de qualidade. Curtiu? Adquira já o seu.',
  },
  {
    id: 'SOM-09',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Kit som automotivo (rádio)',
    keywords: ['radio automotivo', 'som automotivo', 'aparelho de som', 'central multimidia', 'mp3 automotivo'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 167,
    fits8s: true,
    text: 'Esse é o kit que vai mudar o som do seu carro, com Bluetooth, USB, SD e rádio FM. Conecte o celular e curta suas músicas favoritas. Estoque limitado. Garanta já o seu.',
  },

  // Nicho: Mobilidade elétrica
  {
    id: 'MOB-01',
    bank: 'geral',
    niche: 'Mobilidade elétrica',
    productType: 'Scooter elétrica',
    keywords: ['scooter eletrica', 'patinete eletrico', 'moto eletrica'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 147,
    fits8s: true,
    notes: 'Vídeo de referência com 8 s (3,15 mil vendas).',
    text: 'Gente, não é mais seis mil, divide isso por dois! Olha a loucura que fizeram aí embaixo. 36 volts, 350 watts, retrô, LED. Qualquer um pode comprar.',
  },
  {
    id: 'MOB-02',
    bank: 'geral',
    niche: 'Mobilidade elétrica',
    productType: 'Scooter elétrica',
    keywords: ['scooter eletrica', 'patinete eletrico', 'moto eletrica'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 120,
    fits8s: true,
    text: 'Pessoal, dá uma olhada nesse preço: essa scooter elétrica retrô, disponível em duas cores, preta e vermelha. Aproveitem!',
  },
  {
    id: 'MOB-03',
    bank: 'geral',
    niche: 'Mobilidade elétrica',
    productType: 'Bicicleta elétrica',
    keywords: ['bicicleta eletrica', 'bike eletrica', 'e-bike', 'ebike'],
    archetype: 'Achado/Demonstração',
    audience: 'Unissex',
    charCount: 133,
    fits8s: true,
    text: 'Olha essa bike elétrica, que linda, dobrável, super prática para o dia a dia. Eu já deixei no carrinho laranja, corre garantir a sua.',
  },
  {
    id: 'MOB-04',
    bank: 'geral',
    niche: 'Mobilidade elétrica',
    productType: 'Bicicleta elétrica',
    keywords: ['bicicleta eletrica', 'bike eletrica', 'e-bike', 'ebike'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Masculino',
    charCount: 169,
    fits8s: true,
    text: 'Meu amigo, esta bicicleta elétrica está com o preço lá embaixo. Ela me leva para onde preciso e economiza tempo e muito dinheiro. Corre, compre a sua e seja muito feliz!',
  },
  {
    id: 'MOB-05',
    bank: 'geral',
    niche: 'Mobilidade elétrica',
    productType: 'Bicicleta elétrica',
    keywords: ['bicicleta eletrica', 'bike eletrica', 'e-bike', 'ebike'],
    archetype: 'Especificação',
    audience: 'Unissex',
    charCount: 206,
    fits8s: false,
    text: 'Olha essa e-bike! Trava e vai! Muito rápida, motor de 400 watts, farol potente, freio top, amortecedor central, banco confortável, bateria removível, dobra em segundos, cabe no porta-malas. A melhor e-bike!',
  },

  // Nicho: Climatização
  {
    id: 'CLI-01',
    bank: 'geral',
    niche: 'Climatização',
    productType: 'Ventilador',
    keywords: ['ventilador', 'ventilador de mesa', 'ventilador turbo', 'ventilador de coluna', 'climatizador'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 148,
    fits8s: true,
    text: 'Finalmente esse ventilador de mesa 40 cm Turbo entrou numa ótima promoção. Não passe mais calor, garanta o seu agora mesmo com desconto promocional.',
  },
  {
    id: 'CLI-02',
    bank: 'geral',
    niche: 'Climatização',
    productType: 'Ventilador',
    keywords: ['ventilador', 'ventilador de mesa', 'ventilador turbo', 'climatizador'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 155,
    fits8s: true,
    text: 'Tá calor? Então aproveita! Esses ventiladores estão com preço muito bom aí na promoção. Tem gente comprando até para revender. Corre e confira no carrinho!',
  },
  {
    id: 'CLI-03',
    bank: 'geral',
    niche: 'Climatização',
    productType: 'Kit 2 ventiladores',
    keywords: ['kit 2 ventiladores', 'dois ventiladores', '2 ventiladores', 'kit ventilador'],
    archetype: 'Kit/Valor',
    audience: 'Unissex',
    charCount: 201,
    fits8s: false,
    text: 'Dois ventiladores por esse valor? Tá barato demais! Em muitos lugares, esse preço mal paga um. Aqui você já leva dois de uma vez pra refrescar sua casa, quarto ou trabalho. Aproveita e garante os seus!',
  },
  {
    id: 'CLI-04',
    bank: 'geral',
    niche: 'Climatização',
    productType: 'Kit 2 ventiladores',
    keywords: ['kit 2 ventiladores', 'dois ventiladores', '2 ventiladores', 'kit ventilador'],
    archetype: 'Kit/Valor',
    audience: 'Unissex',
    charCount: 206,
    fits8s: false,
    text: 'Dois ventiladores por esse preço, tá barato demais. Em muitos lugares, esse valor mal compra um, e aqui você já leva dois de uma vez. Se o carrinho laranja apareceu, aproveita essa oferta e garante os seus.',
  },
  {
    id: 'CLI-05',
    bank: 'geral',
    niche: 'Climatização',
    productType: 'Kit 2 ventiladores',
    keywords: ['kit 2 ventiladores', 'dois ventiladores', '2 ventiladores', 'kit ventilador'],
    archetype: 'Kit/Valor',
    audience: 'Unissex',
    charCount: 172,
    fits8s: true,
    text: 'Dois ventiladores por esse preço, tá barato demais. Por esse valor, você mal compra um, e aqui leva dois de uma vez. Aproveita, clica no carrinho laranja e garante os seus.',
  },

  // Nicho: Cozinha / Eletroportáteis
  {
    id: 'COZ-01',
    bank: 'geral',
    niche: 'Cozinha / Eletroportáteis',
    productType: 'Panificadora',
    keywords: ['panificadora', 'maquina de pao', 'air fryer', 'fritadeira', 'liquidificador', 'cafeteira', 'panela eletrica', 'processador'],
    archetype: 'Unboxing/Chegou',
    audience: 'Unissex',
    charCount: 403,
    fits8s: false,
    text: 'Gente, olha essa loucura! Todo mundo correndo pra pegar essa panificadora, mas a minha já tá garantida! Acabei de trazer pra casa, olha que design lindo, tudo em preto, e o painel digital é super moderno! Testei hoje mesmo: são 19 programas, é só colocar os ingredientes e ela faz tudo sozinha, muito prático! Vamos pro carrinho agora, de verdade, esse modelo esgota num piscar de olhos, não fiquem sem!',
  },

  // Nicho: Garrafas e copos
  {
    id: 'GAR-01',
    bank: 'geral',
    niche: 'Garrafas e copos',
    productType: 'Garrafinha',
    keywords: ['garrafinha', 'garrafa de agua', 'squeeze', 'copo termico'],
    archetype: 'Achado/Demonstração',
    audience: 'Feminino',
    charCount: 270,
    fits8s: false,
    notes: 'Estilo POV.',
    text: 'Gente, achei a garrafinha mais estética e perfeita pra levar na bolsa. O tamanho de 400 ml é ideal, super sustentável, e olha o brilho dessa tampa. E o melhor: fechei e não vazou absolutamente nada. Super prática pro dia a dia. Clica aqui embaixo pra escolher a sua cor.',
  },
  {
    id: 'GAR-02',
    bank: 'geral',
    niche: 'Garrafas e copos',
    productType: 'Garrafinha',
    keywords: ['garrafinha', 'garrafa de agua', 'squeeze'],
    archetype: 'Achado/Demonstração',
    audience: 'Feminino',
    charCount: 279,
    fits8s: false,
    text: 'Gente, achei a garrafinha mais linda e sustentável pro meu dia a dia. Ela tem essa alça super prática de carregar, e a tampa metálica veda perfeitamente. Além de ser linda com esse desenho simples, não pega cheiro de jeito nenhum. Perfeita pro trabalho e pra academia. Recomendo!',
  },
  {
    id: 'GAR-03',
    bank: 'geral',
    niche: 'Garrafas e copos',
    productType: 'Garrafinha',
    keywords: ['garrafinha', 'garrafa de vidro', 'garrafa silicone'],
    archetype: 'Achado/Demonstração',
    audience: 'Feminino',
    charCount: 171,
    fits8s: true,
    text: 'Tô apaixonada pela minha garrafa. Ela é de vidro por dentro e toda emborrachada de silicone por fora. Olha que linda! Vou deixar o link promocional no carrinho. Aproveita!',
  },
  {
    id: 'GAR-04',
    bank: 'geral',
    niche: 'Garrafas e copos',
    productType: 'Garrafa térmica',
    keywords: ['garrafa termica', 'copo termico', 'garrafa inox'],
    archetype: 'Achado/Demonstração',
    audience: 'Feminino',
    charCount: 279,
    fits8s: false,
    text: 'Gente, achei a garrafa térmica mais estilosa e perfeita para o dia a dia. Design de garrafa de refri, aço inox por dentro, mantém o gelo o dia todo. E o melhor: vira de ponta-cabeça e não vaza uma gota na bolsa. Super prática essa alcinha. Clica aqui embaixo para escolher a sua.',
  },

  // Nicho: Jardim
  {
    id: 'JAR-01',
    bank: 'geral',
    niche: 'Jardim',
    productType: 'Pulverizador elétrico',
    keywords: ['pulverizador eletrico', 'pulverizador', 'borrifador', 'jardim', 'mangueira', 'cortador de grama', 'rocadeira'],
    archetype: 'Unboxing/Chegou',
    audience: 'Unissex',
    charCount: 218,
    fits8s: false,
    notes: 'Storyboard validado: começa com o produto chegando, depois mostra usando e termina falando para a câmera.',
    text: 'Gente, acabou de chegar esse pulverizador elétrico. Coloquei água, ajustei a alça e pronto. Aperto o botão e já consigo pulverizar as plantas sem ficar bombeando com a mão. Pra cuidar do jardim, dá uma olhada por aqui.',
  },

  // Nicho: Pet
  {
    id: 'PET-01',
    bank: 'geral',
    niche: 'Pet',
    productType: 'Spray educador pet (xixi no lugar certo)',
    keywords: ['educador pet', 'spray pet', 'xixi', 'adestrador', 'cachorro', 'gato', 'pet'],
    archetype: 'Dor→Solução',
    audience: 'Unissex',
    charCount: 186,
    fits8s: true,
    text: 'Se ele ainda faz xixi no lugar errado, olha esse kit. Esse aqui você usa onde ele não deve fazer. E esse ajuda a indicar o lugar certo. Agora é repetir e ter paciência com o treinamento.',
  },

  // Nicho: Cabelo e beleza
  {
    id: 'BEL-01',
    bank: 'geral',
    niche: 'Cabelo e beleza',
    productType: 'Elástico de cabelo',
    keywords: ['elastico de cabelo', 'xuxinha', 'prendedor de cabelo', 'presilha', 'acessorio de cabelo'],
    archetype: 'Achado/Demonstração',
    audience: 'Feminino',
    charCount: 213,
    fits8s: false,
    notes: 'Referência de prompt 10 s: @lakishaguai722.',
    text: 'Gente, achei o elástico perfeito, que não quebra o cabelo. Super macio, estica muito e não dá dor de cabeça. Segura qualquer volume de cabelo o dia todo, olha isso. As cores são lindas. Clica aqui embaixo pra ver.',
  },
  {
    id: 'BEL-02',
    bank: 'geral',
    niche: 'Cabelo e beleza',
    productType: 'Escova alisadora (escova chapinha)',
    keywords: ['escova alisadora', 'escova chapinha', 'escova secadora', 'chapinha', 'prancha de cabelo', 'secador de cabelo', 'babyliss'],
    archetype: 'Dor→Solução',
    audience: 'Feminino',
    charCount: 260,
    fits8s: false,
    text: 'Adeus, chapinha que queima a testa. Olha essa escova de cerâmica. Ela esquenta muito rápido. A cerâmica alisa desde a raiz sem puxar os fios e sem te queimar. Perfeita, e vem com esse suporte pra apoiar na mesa com segurança. Clica no carrinho e garante a sua.',
  },

  // Nicho: Casa, banheiro e organização
  {
    id: 'CAS-01',
    bank: 'geral',
    niche: 'Casa, banheiro e organização',
    productType: 'Armário / rack de banheiro',
    keywords: ['armario de banheiro', 'rack de banheiro', 'prateleira', 'organizador de banheiro', 'estante'],
    archetype: 'Dor→Solução',
    audience: 'Feminino',
    charCount: 316,
    fits8s: false,
    text: 'Falta espaço no banheiro e você não pode furar o azulejo? Olha isso! É um rack de chão que aproveita o espaço em cima do vaso. Cabe toalha, cosmético e fica super chique. E ele é super reforçado, não fica bambeando e aguenta bastante peso. Sua pia finalmente vai ficar livre. Garante o seu na cor preta aqui no link.',
  },
  {
    id: 'CAS-02',
    bank: 'geral',
    niche: 'Casa, banheiro e organização',
    productType: 'Pastilha para vaso sanitário',
    keywords: ['pastilha vaso sanitario', 'pastilha adesiva', 'bloco sanitario', 'gel sanitario'],
    archetype: 'Unboxing/Chegou',
    audience: 'Feminino',
    charCount: 248,
    fits8s: false,
    text: 'Chegou meu kit de pastilhas pra vaso sanitário do TikTok Shop! Essa aqui é floral, tem de limão, lavanda e oceano, o cheiro é maravilhoso logo que abre! Olha essa espuma limpando tudinho, não precisa mais ficar esfregando o vaso sanitário todo dia.',
  },
  {
    id: 'CAS-03',
    bank: 'geral',
    niche: 'Casa, banheiro e organização',
    productType: 'Placa de número para casa',
    keywords: ['placa de casa', 'placa de numero', 'numero residencial', 'fachada'],
    archetype: 'Achado/Demonstração',
    audience: 'Unissex',
    charCount: 308,
    fits8s: false,
    text: 'Finalmente os entregadores vão achar minha casa, e com muito estilo. Olha a qualidade: fundo preto espelhado e letras em alto-relevo. Não é adesivo barato, não. É super fácil de instalar e já transforma a fachada da casa na hora, fica com cara de casa de rico. Clica no link pra fazer a sua com seu endereço.',
  },

  // Nicho: Moto e acessórios automotivos
  {
    id: 'MOT-01',
    bank: 'geral',
    niche: 'Moto e acessórios automotivos',
    productType: 'Capa de moto',
    keywords: ['capa de moto', 'capa impermeavel moto', 'capa de carro', 'acessorio moto', 'capacete', 'suporte moto'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 274,
    fits8s: false,
    text: 'Se você deixa sua moto no tempo, olha o que acabou de chegar. Material super grosso e resistente, não é daquelas que rasgam fácil. Bateu a chuva, a água escorre na hora, zero chance de enferrujar sua moto. Tem do tamanho P ao GG, protege sua guerreira clicando aqui embaixo.',
  },

  // Nicho: Conforto para os pés
  {
    id: 'PES2-01',
    bank: 'geral',
    niche: 'Conforto para os pés',
    productType: 'Palmilha de gel',
    keywords: ['palmilha de gel', 'palmilha ortopedica', 'palmilha', 'protetor calcanhar'],
    archetype: 'Dor→Solução',
    audience: 'Unissex',
    charCount: 236,
    fits8s: false,
    text: 'Gente, quem trabalha em pé o dia todo precisa ver isso. Olha a grossura desse gel, ele absorve todo o impacto e transforma qualquer sapato duro na coisa mais confortável do mundo. Vem dois pares, clica aqui embaixo para salvar seus pés.',
  },

  // Nicho: Limpeza e descartáveis
  {
    id: 'LIM-01',
    bank: 'geral',
    niche: 'Limpeza e descartáveis',
    productType: 'Luva descartável',
    keywords: ['luva descartavel', 'luva vinil', 'luva nitrilica', 'viniflex', 'pano magico', 'mop'],
    archetype: 'Dor→Solução',
    audience: 'Feminino',
    charCount: 340,
    fits8s: false,
    text: 'Tá cansada daquelas luvas que rasgam por qualquer coisinha? Olha a resistência dessa Viniflex da Vabani. O ajuste é perfeito e não tem aquele pó chato pra sujar a mão. A sensibilidade ao toque é surreal. Serve pra comida, limpeza, estética, tudo que você imaginar. Vem 100 unidades na caixa, rende demais. Clica no carrinho e garante a sua.',
  },

  // Nicho: Festa e decoração
  {
    id: 'FES-01',
    bank: 'geral',
    niche: 'Festa e decoração',
    productType: 'Saia de babado TNT para mesa de festa',
    keywords: ['saia babado', 'toalha de mesa festa', 'decoracao festa', 'painel festa', 'cortina festa'],
    archetype: 'Achado/Demonstração',
    audience: 'Feminino',
    charCount: 345,
    fits8s: false,
    text: 'Olha o tamanho disso! Pra mesa de festa grande, eu gosto de abrir com alguém, porque já dá pra ver certinho até onde vai cobrir. Cada um pega um lado e vai ajustando. Em poucos minutos a frente da mesa fica toda coberta e a bagunça some da vista. Acabou a festa, eu vou soltando com calma, e assim fica bem mais fácil usar tudo depois do evento.',
  },

  // Nicho: Eletrônicos
  {
    id: 'ELE-01',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Câmera digital',
    keywords: ['camera digital', 'camera 4k', 'filmadora', 'webcam', 'camera de acao'],
    archetype: 'Achado/Demonstração',
    audience: 'Unissex',
    charCount: 123,
    fits8s: true,
    text: 'Meu Deus, olha essa câmera digital! É perfeita pra gravar vídeos em 4K, super estável. Clica no link e garante a sua agora.',
  },
  {
    id: 'ELE-02',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Smartwatch (Apple Watch)',
    keywords: ['smartwatch', 'relogio inteligente', 'apple watch', 'relogio digital'],
    archetype: 'Provocação/Comparação',
    audience: 'Unissex',
    charCount: 255,
    fits8s: false,
    text: 'Ah, mas o rico gosta de ser feito de bobo mesmo, né? Paga mais de 5 mil reais no relógio da maçã, sendo que você pode pegar aqui no TikTok, original, com um ano de garantia e parcelar em até 12 vezes sem juros. Inclusive, tá rolando oferta até meia-noite.',
  },
  {
    id: 'ELE-03',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Celular',
    keywords: ['celular', 'smartphone', 'iphone', 'xiaomi', 'samsung', 'motorola'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 260,
    fits8s: false,
    text: 'Olha o preço disso aqui agora! Acabou de entrar em oferta relâmpago e tem muita gente conseguindo pegar com frete grátis. Aproveita, que só vai até a meia-noite. Eu vou deixar o link com desconto aqui no carrinho laranja. Já clica e pega o seu antes que acabe!',
  },
  {
    id: 'ELE-04',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Celular',
    keywords: ['celular', 'smartphone', 'poco', 'xiaomi', 'redmi'],
    archetype: 'Especificação',
    audience: 'Unissex',
    charCount: 180,
    fits8s: true,
    text: 'Procurando o celular mais top do momento? Esse é o novo Poco X8 Pro. Olha esse design! Ele voa com um processador de ponta e a bateria dura muito. Curtiu? Comenta aqui o que achou.',
  },
  {
    id: 'ELE-05',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Celular',
    keywords: ['celular', 'smartphone', 's26 ultra', '512gb', '256gb'],
    archetype: 'Unboxing/Chegou',
    audience: 'Unissex',
    charCount: 199,
    fits8s: true,
    isStarred: true,
    notes: '⭐ Melhor copy de celular (produto de ~R$ 600).',
    text: 'Gente, olha esse lançamento! Consegui meu BML S26 Ultra. Olha essa tela infinita, o design é simplesmente incrível, é muito rápido, são 512 GB de memória, fotos em alta resolução. Corre pra garantir!',
  },
  {
    id: 'ELE-06',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Monitor',
    keywords: ['monitor', 'monitor gamer', 'monitor curvo', 'tv', 'televisao'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 192,
    fits8s: true,
    isStarred: true,
    notes: '⭐ Melhor copy de monitor (10 s, produto de ~R$ 600).',
    text: 'Agora é oficial, o TikTok endoidou. Esse monitor Valac Z18 Maze baixou mais da metade, com tela curva super imersiva e imagens muito nítidas, saindo por menos que uma pizza. Clica no carrinho!',
  },
  {
    id: 'ELE-07',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Monitor',
    keywords: ['monitor', 'monitor gamer', 'tela'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 231,
    fits8s: false,
    text: 'Últimas 20 unidades em estoque. O TikTok tá dando quase de graça esse monitor Galfolk. Por esse preço tem gente comprando pra revender, não dá nem pra acreditar. Eu, se fosse você, não deixava passar. Aproveita e clica no carrinho.',
  },
  {
    id: 'ELE-08',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Tablet',
    keywords: ['tablet', 'ipad', 'notebook'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 122,
    fits8s: true,
    text: 'Vou fazer preço de fábrica nesse tablet lançamento do TikTok. Nesse preço, nem na China! Compre apertando no botão abaixo.',
  },

  // Nicho: Infantil e brinquedos
  {
    id: 'INF-01',
    bank: 'geral',
    niche: 'Infantil e brinquedos',
    productType: 'Jipe elétrico infantil',
    keywords: ['jipe eletrico', 'carrinho eletrico', 'quadriciclo infantil', 'mini carro eletrico', 'carro eletrico infantil'],
    archetype: 'Emoção/Presente',
    audience: 'Unissex',
    charCount: 217,
    fits8s: false,
    isStarred: true,
    notes: '⭐ Melhor copy para carrinhos elétricos e brinquedos grandes.',
    text: 'Eu não quero nem saber o preço, eu quero saber em quantas vezes dá pra parcelar. Imagina a felicidade de uma criança ganhando um jipe elétrico desses? É diversão garantida e aquele presente que faz os olhos brilharem.',
  },
  {
    id: 'INF-02',
    bank: 'geral',
    niche: 'Infantil e brinquedos',
    productType: 'Jipe elétrico infantil',
    keywords: ['jipe eletrico', 'carrinho eletrico', 'quadriciclo infantil', 'carro eletrico infantil'],
    archetype: 'Emoção/Presente',
    audience: 'Unissex',
    charCount: 137,
    fits8s: true,
    text: 'Eu não quero saber o preço, eu quero saber em quantas vezes parcela. Imagina a alegria da criança de ganhar esse jipe elétrico. Perfeito!',
  },
  {
    id: 'INF-03',
    bank: 'geral',
    niche: 'Infantil e brinquedos',
    productType: 'Triciclo elétrico infantil',
    keywords: ['triciclo eletrico', 'triciclo drift', 'patinete infantil', 'brinquedo infantil'],
    archetype: 'Emoção/Presente',
    audience: 'Unissex',
    charCount: 186,
    fits8s: true,
    text: 'Olha o brinquedo que tá deixando a criançada apaixonada. Esse triciclo elétrico faz drift 360, tem luzes de LED, 3 velocidades e muita diversão. Garanta o presente que vai fazer sucesso.',
  },
  {
    id: 'INF-04',
    bank: 'geral',
    niche: 'Infantil e brinquedos',
    productType: 'Triciclo elétrico infantil',
    keywords: ['triciclo eletrico', 'triciclo drift'],
    archetype: 'Unboxing/Chegou',
    audience: 'Unissex',
    charCount: 125,
    fits8s: true,
    text: 'Gente, tá todo mundo correndo pra pegar! Eu consegui o meu Triciclo Drift, ele gira em 360 graus. Corre antes que acabe tudo!',
  },
  {
    id: 'INF-05',
    bank: 'geral',
    niche: 'Infantil e brinquedos',
    productType: 'Triciclo elétrico infantil',
    keywords: ['triciclo eletrico', 'triciclo drift', 'brinquedo'],
    archetype: 'Provocação/Comparação',
    audience: 'Unissex',
    charCount: 218,
    fits8s: false,
    text: 'Não é porque você não é rico que seu filho não pode ter um desses. Olha esse triciclo elétrico, imagina a alegria dele andando por aí. Clique onde está escrito "veja aqui", olha o preço e aproveita, que está em oferta.',
  },
  {
    id: 'INF-06',
    bank: 'geral',
    niche: 'Infantil e brinquedos',
    productType: 'Carrinho de bebê',
    keywords: ['carrinho de bebe', 'carrinho de passeio', 'bebe conforto', 'berco'],
    archetype: 'Achado/Demonstração',
    audience: 'Unissex',
    charCount: 143,
    fits8s: true,
    text: 'Olha que prático: tem cobertura, proteção e alça para empurrar, facilitando muito os passeios do dia a dia. Corre conferir no carrinho laranja.',
  },

  // Nicho: Fitness
  {
    id: 'FIT-01',
    bank: 'geral',
    niche: 'Fitness',
    productType: 'Esteira elétrica',
    keywords: ['esteira eletrica', 'esteira ergometrica', 'esteira dobravel', 'bicicleta ergometrica'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 221,
    fits8s: false,
    text: 'Agora é oficial, o TikTok endoidou. Essa esteira elétrica dobrável caiu pra menos da metade. Silenciosa, com controle e painel LED. E ainda suporta até 100 quilos. Menos que uma pizza. Acaba hoje. Clica no carrinho agora.',
  },
  {
    id: 'FIT-02',
    bank: 'geral',
    niche: 'Fitness',
    productType: 'Esteira elétrica',
    keywords: ['esteira eletrica', 'esteira ergometrica', 'esteira dobravel'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Feminino',
    charCount: 229,
    fits8s: false,
    text: 'Não dá nem pra acreditar que tá por esse preço. Essa esteira ergométrica tá saindo por preço de fábrica. Então, se você tá cansada de não conseguir treinar quando chove ou quer um impulso quando dá aquela preguicinha, é pra você.',
  },

  // Nicho: Energia
  {
    id: 'ENE-01',
    bank: 'geral',
    niche: 'Energia',
    productType: 'Bateria (energia para casa)',
    keywords: ['bateria', 'estacao de energia', 'gerador', 'painel solar', 'inversor', 'power bank'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 230,
    fits8s: false,
    text: 'Gente, o TikTok deve ter ficado maluco! Olha esse produto aqui, eu cliquei achando que era brincadeira, mas o preço é de verdade. Se o botão laranja ainda estiver aparecendo para você, clique nele, porque deve esgotar rapidamente.',
  },
  {
    id: 'ENE-02',
    bank: 'geral',
    niche: 'Energia',
    productType: 'Bateria de lítio',
    keywords: ['bateria de litio', 'bateria lifepo4', 'bateria solar', 'bateria estacionaria'],
    archetype: 'Especificação',
    audience: 'Unissex',
    charCount: 248,
    fits8s: false,
    text: 'Consegui pegar a minha na loja. Essa bateria é incrível. Olha esse visor LCD, muito mais leve que as outras. O conector já tá funcionando, dá pra levar pra qualquer lugar. Lítio com BMS integrado. Esquece o chumbo-ácido. Corre antes que acabe tudo.',
  },

  // Nicho: Ferramentas
  {
    id: 'FER-01',
    bank: 'geral',
    niche: 'Ferramentas',
    productType: 'Alicate hidráulico',
    keywords: ['alicate hidraulico', 'alicate de crimpar', 'ferramenta a bateria', 'parafusadeira', 'furadeira', 'chave de impacto'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 123,
    fits8s: true,
    text: 'Ainda fazendo força para crimpar? Olha esse alicate hidráulico à bateria! Vem na maleta, com matrizes. Confere no carrinho!',
  },
  {
    id: 'FER-02',
    bank: 'geral',
    niche: 'Ferramentas',
    productType: 'Punção elétrica hidráulica',
    keywords: ['puncao eletrica', 'puncionadeira', 'furadeira de bancada', 'esmerilhadeira', 'serra eletrica', 'maquina de solda'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 357,
    fits8s: false,
    text: 'Gente, olha esse achado pra quem trabalha com metal! Essa punção elétrica hidráulica entrou em superoferta. Ela tem 200 W de potência e 20 toneladas de força. Vem com nove matrizes diferentes pra você fazer furos redondos ou ovais, com um acabamento perfeito. Tem envio para todo o Brasil, gente! Corre e clica aqui embaixo, no carrinho, pra garantir a sua.',
  },

  // Nicho: Agro e roça
  {
    id: 'AGR-01',
    bank: 'geral',
    niche: 'Agro e roça',
    productType: 'Motocultivador',
    keywords: ['motocultivador', 'tratorito', 'rocadeira a gasolina', 'perfurador de solo', 'motosserra', 'arado'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 194,
    fits8s: true,
    text: 'Quer preparar a terra com muito mais praticidade? Esse motocultivador Buffalo de 7 cavalos já vem com arado, ideal para preparar o solo. Uma máquina forte para a roça. Toque no carrinho laranja!',
  },

  // Nicho: Música
  {
    id: 'MUS-01',
    bank: 'geral',
    niche: 'Música',
    productType: 'Pedaleira para banda',
    keywords: ['pedaleira', 'pedal guitarra', 'instrumento musical', 'violao', 'guitarra', 'mesa de som', 'microfone sem fio'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 208,
    fits8s: false,
    text: 'Quem comprou ontem essa pedaleira vai chorar ao ver o preço que ela está hoje. Ela tem bateria recarregável. Controle tudo via aplicativo. Ideal para igrejas e apresentações ao vivo. Compre já no TikTok Shop!',
  },
];

/**
 * SEÇÃO 12 — BANCO DE COPIES — CALÇADOS MASCULINOS
 */
export const COPIES_CALCADOS_MASCULINOS: CopyBankEntry[] = [
  {
    id: 'CAL-01',
    bank: 'calcados_masculinos',
    niche: 'Calçados masculinos',
    productType: 'Tênis masculino',
    keywords: ['tenis', 'sapato', 'sapatenis', 'bota', 'coturno', 'chuteira', 'calcado'],
    archetype: 'Unboxing/Chegou',
    audience: 'Masculino',
    charCount: 195,
    fits8s: true,
    text: 'Gente, a caixa do TikTok chegou! Olha esse tênis, olha esse amortecimento, adeus dor no joelho no treino. Super leve e muito confortável no pé. Bora correr? Clica aqui embaixo, vale muito a pena!',
  },
  {
    id: 'CAL-02',
    bank: 'calcados_masculinos',
    niche: 'Calçados masculinos',
    productType: 'Tênis masculino',
    keywords: ['tenis', 'sapato', 'sapatenis', 'mocassim', 'calcado'],
    archetype: 'Achado/Demonstração',
    audience: 'Masculino',
    charCount: 149,
    fits8s: true,
    text: 'Olha esse tênis. Versátil, moderno e perfeito para acompanhar a rotina. Combina com treino, caminhada ou aquele look casual. O link está no carrinho.',
  },
  {
    id: 'CAL-03',
    bank: 'calcados_masculinos',
    niche: 'Calçados masculinos',
    productType: 'Kit 2 pares de tênis masculino',
    keywords: ['kit 2 pares', 'dois pares', '2 pares', 'kit tenis'],
    archetype: 'Kit/Valor',
    audience: 'Masculino',
    charCount: 262,
    fits8s: false,
    text: 'Paguei o preço de um e recebi dois pares, perfeitos para a academia. Olha a flexibilidade e o amortecimento disso. Super leve, e o pé respira o treino todo. O design é lindo. O kit com 2 está quase de graça hoje. Clique aqui embaixo antes que acabe o seu número.',
  },
  {
    id: 'CAL-04',
    bank: 'calcados_masculinos',
    niche: 'Calçados masculinos',
    productType: 'Kit 2 pares de tênis masculino',
    keywords: ['kit 2 pares', 'dois pares', '2 pares', 'kit tenis'],
    archetype: 'Unboxing/Chegou',
    audience: 'Masculino',
    charCount: 249,
    fits8s: false,
    text: 'Cara, não acredito que chegou o meu kit com dois pares. Olha a maciez disso aqui, dá pra dobrar no meio e não estraga. Parece que você tá pisando nas nuvens, super leve. Pra academia ou pro dia a dia, perfeito. Clica no carrinho e garante o seu kit.',
  },
];

/**
 * SEÇÃO 13 — BANCO DE COPIES — ROUPAS MASCULINAS
 */
export const COPIES_ROUPAS_MASCULINAS: CopyBankEntry[] = [
  {
    id: 'ROU-01',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Camiseta masculina',
    keywords: ['camiseta', 'camisa', 'blusa masculina', 'streetwear', 'oversized', 'algodao', 'polo'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 273,
    fits8s: false,
    text: 'Se liga nessa camiseta streetwear, a estampa é insana e a qualidade vai te surpreender. 100% algodão fio 30.1 de verdade. Não esquenta, super macia. Costura premium com reforço na gola e nos ombros, feita pra durar. Caimento perfeito. O estoque tá voando, já garante a sua.',
  },
  {
    id: 'ROU-02',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Bermuda masculina',
    keywords: ['bermuda', 'short', 'shorts', 'bermuda treino', 'short academia'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 250,
    fits8s: false,
    text: 'Irmão, achei a bermuda que resolveu o problema do celular no treino. Olha esse bolso secreto: você corre e o celular não balança por nada. Zero assadura na perna e máximo conforto. Todo mundo na academia tá usando. Clica aqui embaixo e garante a sua.',
  },
  {
    id: 'ROU-03',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Kit 2 bermudas / shorts 2 em 1',
    keywords: ['kit 2 bermudas', 'kit 2 shorts', 'short 2 em 1', 'kit bermuda', 'kit shorts'],
    archetype: 'Kit/Valor',
    audience: 'Masculino',
    charCount: 317,
    fits8s: false,
    text: 'Gente, olha esse kit com dois shorts 2 em 1 que acabou de chegar pra treinar. Veste super anatômico no corpo, o tecido dry fit é muito leve. Tem bolso no forro pra prender o celular firme sem pressão, e dá pra agachar pesado com segurança. Muito confortável pra corrida, academia e treino diário, com total liberdade.',
  },
  {
    id: 'ROU-04',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Kit 4 camisetas térmicas',
    keywords: ['camisa termica', 'camiseta termica', 'segunda pele', 'protecao uv', 'kit 4 camisas', 'kit camisetas'],
    archetype: 'Kit/Valor',
    audience: 'Masculino',
    charCount: 301,
    fits8s: false,
    text: 'E aí, mano, olha o que eu recebi. Kit com 4 camisas térmicas baratinhas, mas de qualidade. Olha a elasticidade dela, fica como uma segunda pele super confortável. Protege do sol e é super fresca. Pra trabalho, andar de bike ou de canoa. E a melhor parte: leva 4 unidades. Toca embaixo e garante o seu.',
  },
  {
    id: 'ROU-05',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Calça jogger de frio',
    keywords: ['calca jogger', 'calca moletom', 'calca masculina', 'jogger', 'moletom'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 303,
    fits8s: false,
    text: 'Esfriou, né? Achei aquela jogger perfeita pra treinar ou sair sem congelar. Olha esse forro felpudo por dentro, é super grossinho e macio, esquenta demais. E o melhor: tem elástico na cintura e não prende o movimento, dá pra caminhar de boa. Tem várias cores no carrinho, clica e garanta a sua pro frio.',
  },
  {
    id: 'ROU-06',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Calça jogger de frio',
    keywords: ['calca jogger', 'calca moletom', 'calca flanelada', 'jogger', 'calca de frio'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 268,
    fits8s: false,
    text: 'Cara, se você odeia passar frio, olha o que eu achei no TikTok. Ela é toda flanelada por dentro, muito macia e não passa vento nenhum. O caimento é perfeito, tem bolso fundo e o cós ajusta super bem no corpo. O melhor investimento pro frio tá aqui no carrinho laranja.',
  },
];

/**
 * TABELA 4.3 — NICHOS VIZINHOS
 */
export const NEIGHBOR_NICHE_RULES: { keywords: string[]; targetNiches: string[] }[] = [
  {
    keywords: ['tablet', 'notebook', 'fone', 'headphone', 'earbuds', 'caixa de som portatil', 'smartwatch', 'relogio', 'tv', 'televisao', 'projetor', 'celular', 'smartphone', 'monitor', 'camera', 'carregador', 'mouse', 'teclado', 'webcam', 'ring light', 'microfone'],
    targetNiches: ['Eletrônicos'],
  },
  {
    keywords: ['furadeira', 'parafusadeira', 'esmerilhadeira', 'serra', 'compressor', 'solda', 'alicate', 'puncao', 'chave', 'ferramenta', 'lixadeira', 'martelete', 'trena', 'nivel laser', 'soprador', 'tupia', 'plaina'],
    targetNiches: ['Ferramentas'],
  },
  {
    keywords: ['rocadeira', 'cortador de grama', 'semente', 'sementes', 'mangueira', 'adubo', 'pulverizador', 'podador', 'jardim', 'grama', 'planta', 'motosserra', 'aparador de grama', 'irrigador'],
    targetNiches: ['Jardim', 'Agro e roça'],
  },
  {
    keywords: ['ar-condicionado', 'ar condicionado', 'climatizador', 'aquecedor', 'umidificador', 'ventilador', 'circulador'],
    targetNiches: ['Climatização'],
  },
  {
    keywords: ['patinete', 'monociclo', 'moto eletrica', 'scooter', 'bicicleta eletrica', 'e-bike', 'ebike', 'hoverboard'],
    targetNiches: ['Mobilidade elétrica'],
  },
  {
    keywords: ['air fryer', 'fritadeira', 'liquidificador', 'cafeteira', 'mixer', 'panela eletrica', 'panificadora', 'batedeira', 'sanduicheira', 'torradeira', 'chaleira', 'processador de alimentos', 'espremedor', 'forno eletrico', 'churrasqueira eletrica', 'panela de pressao'],
    targetNiches: ['Cozinha / Eletroportáteis'],
  },
  {
    keywords: ['copo termico', 'marmita', 'pote', 'garrafa', 'garrafinha', 'squeeze', 'stanley', 'caneca termica', 'jarra'],
    targetNiches: ['Garrafas e copos'],
  },
  {
    keywords: ['secador', 'chapinha', 'babyliss', 'maquiagem', 'skincare', 'escova alisadora', 'escova secadora', 'elastico de cabelo', 'serum', 'batom', 'creme', 'perfume', 'depilador', 'modelador de cachos', 'prancha de cabelo'],
    targetNiches: ['Cabelo e beleza'],
  },
  {
    keywords: ['organizador', 'prateleira', 'cortina', 'tapete', 'cama', 'mesa', 'banho', 'lencol', 'travesseiro', 'toalha', 'armario', 'rack', 'banheiro', 'placa de casa', 'cabide', 'sapateira', 'cesto', 'varal', 'edredom', 'cobertor'],
    targetNiches: ['Casa, banheiro e organização'],
  },
  {
    keywords: ['pneu', 'capa de carro', 'central multimidia', 'camera de re', 'acessorio de carro', 'capa de moto', 'capacete', 'bau moto', 'som automotivo', 'alto-falante', 'amplificador', 'aspirador automotivo', 'led automotivo'],
    targetNiches: ['Moto e acessórios automotivos', 'Som automotivo'],
  },
  {
    keywords: ['brinquedo', 'bebe', 'fralda', 'cadeirinha', 'jipe eletrico', 'triciclo', 'carrinho de bebe', 'boneca', 'pelucia', 'infantil', 'crianca', 'patins', 'bicicleta infantil'],
    targetNiches: ['Infantil e brinquedos'],
  },
  {
    keywords: [
      'banco de exercicios',
      'banco de exercicio',
      'banco ajustavel',
      'banco reclinavel',
      'banco de musculacao',
      'banco supino',
      'apoio scott',
      'extensor de pernas',
      'supino',
      'musculacao',
      'abdominal',
      'barra fixa',
      'estacao de musculacao',
      'halter',
      'halteres',
      'anilhas',
      'kettlebell',
      'elastico de treino',
      'bicicleta ergometrica',
      'spinning',
      'colchonete',
      'esteira',
      'academia',
      'fitness',
      'treino',
      'exercicio',
      'exercicios',
      'corda de pular',
    ],
    targetNiches: ['Fitness'],
  },
  {
    keywords: ['painel solar', 'gerador', 'power bank', 'inversor', 'bateria', 'estacao de energia', 'no-break', 'nobreak', 'placa solar'],
    targetNiches: ['Energia'],
  },
];

export interface ProductSpecsExtracted {
  shortName: string;
  subMode: Produtos2SubMode;
  maleSubOption: Produtos2MaleSubOption;
  niche: string;
  influencer: Produtos2Influencer;
  clientGender: Produtos2ClientGender;
  watts?: string;
  voltage?: string;
  capacityMl?: string;
  inches?: string;
  kitQuantity?: number;
  colors: string[];
  material?: string;
  brandModel?: string;
  isExpensive?: boolean;
  isKidsProduct?: boolean;
  keyFacts: string[];
}

/**
 * Analisa "Informações do Produto" em tempo real para o Modo Produtos 2.0
 */
export function analyzeProductInfoForProdutos2(rawText: string): ProductSpecsExtracted {
  const text = (rawText || '').trim();
  const norm = normalizeAccents(text);

  // 1. Extrair números e especificações concretas
  const wattsMatch = text.match(/\b(\d+(?:[.,]\d+)?\s*(?:w|watts|w\s*rms|rms))\b/i);
  const voltsMatch = text.match(/\b(\d+\s*(?:v|volts|bivolt))\b/i);
  const mlMatch = text.match(/\b(\d+(?:[.,]\d+)?\s*(?:ml|litros?|l))\b/i);
  const inchesMatch = text.match(/\b(\d+(?:[.,]\d+)?\s*(?:polegadas|pol|cm|mm|metros?|m))\b/i);
  const kitMatch = norm.match(/\b(?:kit\s*(?:com\s*)?|leve\s*|vem\s*)(\d+)\s*(?:pares|unidades|pecas|camisetas|camisas|bermudas|shorts|ventiladores|alto-falantes|alto falantes)\b/i);
  const kitQty = kitMatch ? parseInt(kitMatch[1], 10) : (/\bkit\s*2\b|\bdois\b|\b2\s*pares\b|\b2\s*unidades\b/i.test(norm) ? 2 : undefined);

  const colorCandidates = ['preto', 'preta', 'branco', 'branca', 'vermelho', 'vermelha', 'azul', 'rosa', 'verde', 'cinza', 'amarelo', 'bege', 'marrom', 'dourado', 'prata', 'roxo', 'laranja'];
  const colors = colorCandidates.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(norm));

  const materialCandidates = ['carbono', 'inox', 'aco inox', 'aco', 'ceramica', 'silicone', 'vidro', 'algodao', 'dry fit', 'flanelado', 'felpudo', 'couro', 'eva', 'gel', 'litio', 'tnt', 'vinil', 'metal'];
  const foundMaterial = materialCandidates.find((m) => norm.includes(m));

  // 2. Detectar se é Calçado Masculino ou Roupa Masculina vs Produto Geral
  const footwearTerms = ['tenis', 'sapato', 'sapatenis', 'bota', 'coturno', 'chuteira', 'chinelo', 'sandalia', 'papete', 'mocassim'];
  const maleApparelTerms = ['camiseta', 'camisa', 'bermuda', 'short', 'shorts', 'calca jogger', 'jogger', 'moletom', 'jaqueta', 'cueca', 'sunga', 'camisa termica', 'camiseta termica'];
  const femaleOnlyApparelTerms = ['vestido', 'saia', 'cropped', 'baby doll', 'babydoll', 'camisola', 'sutia', 'calcinha', 'lingerie', 'biquini', 'maio', 'rasteirinha', 'scarpin', 'salto alto'];

  const isFootwear = footwearTerms.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(norm)) && !norm.includes('palmilha');
  const isApparel = maleApparelTerms.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(norm)) && !norm.includes('saia babado') && !norm.includes('mesa');
  const isFemaleExplicit = /\b(feminino|feminina|mulher|mulheres|para ela|dama)\b/i.test(norm) || femaleOnlyApparelTerms.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(norm));
  const isMaleExplicit = /\b(masculino|masculina|homem|homens|para ele)\b/i.test(norm);

  let subMode: Produtos2SubMode = 'produtos_geral';
  let maleSubOption: Produtos2MaleSubOption = 'calcados';

  if ((isFootwear || isApparel) && !isFemaleExplicit) {
    subMode = 'vestuario_masculino';
    maleSubOption = isFootwear ? 'calcados' : 'roupas';
  }

  // 3. Extrair Nome Curto e Falável (ex: "Roçadeira 2000 W", "Banco de Exercícios", "Kit 2 Tênis")
  let shortName = '';
  const specificShortNames: [RegExp, string][] = [
    [/\bbanco\s+(?:de\s+)?(?:exercicios?|musculacao|supino|treino)/i, 'Banco de Exercícios'],
    [/\bbanco\s+(?:ajustavel|reclinavel|dobravel)/i, 'Banco Ajustável'],
    [/\bestacao\s+de\s+musculacao/i, 'Estação de Musculação'],
    [/\bvara\s+(?:de\s+)?(?:pesca|pescar|carbono)/i, 'Vara de Carbono'],
    [/\blinha\s+de\s+pesca/i, 'Linha de Pesca'],
    [/\boculos\s+de\s+natacao/i, 'Óculos de Natação'],
    [/\bamplificador\s+automotivo|\bmodulo\s+amplificador/i, 'Amplificador Automotivo'],
    [/\bkit\s+(?:com\s+)?4\s+alto[-\s]?falantes/i, 'Kit 4 Alto-Falantes'],
    [/\balto[-\s]?falante|\bautofalante/i, 'Alto-Falante Automotivo'],
    [/\bsom\s+automotivo|\bradio\s+automotivo/i, 'Som Automotivo'],
    [/\bscooter\s+eletrica/i, 'Scooter Elétrica'],
    [/\bbicicleta\s+eletrica|\bbike\s+eletrica|\be-bike/i, 'Bicicleta Elétrica'],
    [/\bkit\s+(?:com\s+)?2\s+ventiladores|\bdois\s+ventiladores/i, 'Kit 2 Ventiladores'],
    [/\bventilador/i, 'Ventilador Turbo'],
    [/\bar[-\s]?condicionado\s+portatil/i, 'Ar-Condicionado Portátil'],
    [/\bclimatizador/i, 'Climatizador de Ar'],
    [/\bpanificadora/i, 'Panificadora Automática'],
    [/\bair\s*fryer|\bfritadeira\s+eletrica/i, 'Air Fryer'],
    [/\bgarrafa\s+termica/i, 'Garrafa Térmica'],
    [/\bcopo\s+termico/i, 'Copo Térmico'],
    [/\bgarrafinha|\bgarrafa\s+de\s+agua/i, 'Garrafinha'],
    [/\bpulverizador\s+eletrico/i, 'Pulverizador Elétrico'],
    [/\brocadeira/i, 'Roçadeira'],
    [/\bcortador\s+de\s+grama/i, 'Cortador de Grama'],
    [/\beducador\s+pet|\bspray\s+educa|\bxixi/i, 'Kit Educador Pet'],
    [/\belastico\s+de\s+cabelo|\bxuxinha/i, 'Elástico de Cabelo'],
    [/\bescova\s+alisadora|\bescova\s+chapinha|\bescova\s+secadora/i, 'Escova Alisadora'],
    [/\bchapinha|\bprancha\s+de\s+cabelo/i, 'Chapinha de Cerâmica'],
    [/\bsecador\s+de\s+cabelo/i, 'Secador de Cabelo'],
    [/\barmario\s+de\s+banheiro|\brack\s+de\s+banheiro|\brack\s+de\s+chao/i, 'Rack de Banheiro'],
    [/\bpastilha\s+(?:para\s+|de\s+)?vaso\s+sanitario/i, 'Pastilha Sanitária'],
    [/\bplaca\s+de\s+(?:casa|numero|endereco)/i, 'Placa de Casa'],
    [/\bcapa\s+de\s+moto/i, 'Capa de Moto'],
    [/\bpalmilha\s+(?:de\s+)?gel|\bpalmilha\s+ortopedica/i, 'Palmilha de Gel'],
    [/\bluva\s+descartavel|\bviniflex/i, 'Luva Descartável'],
    [/\bsaia\s+(?:de\s+)?babado|\btoalha\s+decorativa/i, 'Saia de Mesa TNT'],
    [/\bcamera\s+digital|\bcamera\s+4k/i, 'Câmera Digital 4K'],
    [/\bsmartwatch|\bapple\s+watch|\brelogio\s+inteligente/i, 'Smartwatch'],
    [/\bcelular|\bsmartphone|\bpoco\s+x\d+|\bs26\s+ultra/i, 'Smartphone'],
    [/\bmonitor/i, 'Monitor Curvo'],
    [/\btablet/i, 'Tablet'],
    [/\bjipe\s+eletrico|\bcarrinho\s+eletrico|\bquadriciclo/i, 'Jipe Elétrico Infantil'],
    [/\btriciclo\s+eletrico|\btriciclo\s+drift/i, 'Triciclo Elétrico Drift'],
    [/\bcarrinho\s+de\s+bebe/i, 'Carrinho de Bebê'],
    [/\besteira\s+eletrica|\besteira\s+ergometrica|\besteira\s+dobravel/i, 'Esteira Elétrica'],
    [/\bbateria\s+de\s+litio|\bbateria\s+lifepo4|\bbateria/i, 'Bateria de Lítio'],
    [/\balicate\s+hidraulico/i, 'Alicate Hidráulico'],
    [/\bpuncao\s+eletrica|\bpuncionadeira/i, 'Punção Elétrica Hidráulica'],
    [/\bparafusadeira/i, 'Parafusadeira'],
    [/\bfuradeira/i, 'Furadeira'],
    [/\bmotocultivador/i, 'Motocultivador'],
    [/\bpedaleira/i, 'Pedaleira'],
    [/\btinta\s+(?:de\s+parede|acrilica|lavavel|emborrachada)/i, 'Tinta de Parede'],
    [/\bkit\s+(?:com\s+)?2\s+pares\s+de\s+tenis|\bkit\s+2\s+tenis|\bdois\s+pares/i, 'Kit 2 Pares de Tênis'],
    [/\btenis/i, 'Tênis Masculino'],
    [/\bsapatenis/i, 'Sapatênis'],
    [/\bkit\s+(?:com\s+)?2\s+(?:bermudas|shorts)|\bshorts?\s+2\s+em\s+1/i, 'Kit 2 Shorts 2 em 1'],
    [/\bkit\s+(?:com\s+)?4\s+camis(?:as|etas)\s+termicas|\bcamisa\s+termica/i, 'Kit 4 Camisas Térmicas'],
    [/\bcalca\s+jogger|\bjogger/i, 'Calça Jogger'],
    [/\bbermuda/i, 'Bermuda Masculina'],
    [/\bcamiseta/i, 'Camiseta Masculina'],
    [/\bcamisa/i, 'Camisa Masculina'],
  ];

  for (const [regex, label] of specificShortNames) {
    if (regex.test(norm)) {
      shortName = label;
      break;
    }
  }

  if (!shortName && text) {
    const firstLine = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0] || '';
    const cleaned = firstLine.replace(/^[-*#•\s]+/, '').replace(/^(produto|nome|titulo|item)\s*[:=-]\s*/i, '').trim();
    const words = cleaned.split(/\s+/).slice(0, 4).join(' ');
    if (words.length >= 2) {
      shortName = words.charAt(0).toUpperCase() + words.slice(1);
    }
  }

  // Se tiver potência em Watts para ferramentas/roçadeiras/som e não estiver no nome curto, anexa de forma concisa
  if (wattsMatch && shortName && /rocadeira|furadeira|parafusadeira|cortador|liquidificador|secador|puncao/i.test(norm)) {
    const cleanW = wattsMatch[1].replace(/\s+/g, '').toUpperCase();
    if (!shortName.toLowerCase().includes('w')) {
      shortName = `${shortName} ${cleanW}`;
    }
  }

  // 4. Detectar Nicho (Prioridade 1/2: banco direto; Prioridade 3: nichos vizinhos)
  let niche = 'Produtos Gerais';
  if (subMode === 'vestuario_masculino') {
    niche = maleSubOption === 'calcados' ? 'Calçados masculinos' : 'Roupas masculinas';
  } else {
    // Checa primeiro regras de nicho vizinho mais específicas (como banco de exercícios -> Fitness)
    for (const rule of NEIGHBOR_NICHE_RULES) {
      if (rule.keywords.some((kw) => norm.includes(normalizeAccents(kw)))) {
        niche = rule.targetNiches[0];
        break;
      }
    }
    if (niche === 'Produtos Gerais') {
      for (const entry of COPIES_PRODUTOS_GERAIS) {
        if (entry.keywords.some((kw) => norm.includes(normalizeAccents(kw)))) {
          niche = entry.niche;
          break;
        }
      }
    }
  }

  // 5. Detectar Influencer (Homem / Mulher / null quando ambíguo — Seção 2 item 6)
  let influencer: Produtos2Influencer = null;
  let clientGender: Produtos2ClientGender = 'Unissex';

  const clearlyMaleNiches = ['Pesca', 'Som automotivo', 'Moto e acessórios automotivos', 'Ferramentas', 'Agro e roça', 'Calçados masculinos', 'Roupas masculinas'];
  const clearlyFemaleNiches = ['Cabelo e beleza', 'Limpeza e descartáveis', 'Festa e decoração', 'Garrafas e copos'];
  const isKidsOrAmbiguous =
    niche === 'Infantil e brinquedos' ||
    niche === 'Eletrônicos' ||
    niche === 'Climatização' ||
    niche === 'Energia' ||
    niche === 'Natação / Esporte aquático' ||
    niche === 'Pet' ||
    niche === 'Conforto para os pés' ||
    niche === 'Música';

  if (subMode === 'vestuario_masculino' || isMaleExplicit || clearlyMaleNiches.includes(niche) || /\b(banco de exercicio|banco ajustavel|supino|musculacao|apoio scott)\b/i.test(norm)) {
    influencer = 'Homem';
    clientGender = 'Masculino';
  } else if (isFemaleExplicit || clearlyFemaleNiches.includes(niche) || /banheiro|toalha|cosmetico|esteira ergometrica/i.test(norm)) {
    influencer = 'Mulher';
    clientGender = 'Feminino';
  } else if (isKidsOrAmbiguous) {
    influencer = null;
    clientGender = 'Unissex';
  }

  // Extrair fatos-chave da descrição para adaptação
  const keyFacts = text
    .split(/[\r\n.;•-]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6 && s.length < 120)
    .slice(0, 6);

  const isExpensive =
    /\b(scooter|bicicleta eletrica|e-bike|celular|smartphone|monitor|tablet|esteira|banco de exercicio|banco ajustavel|bateria|panificadora|motocultivador|puncao|jipe eletrico|triciclo|smartwatch)\b/i.test(norm);

  const isKidsProduct = niche === 'Infantil e brinquedos' || /\b(crianca|infantil|filho|bebe|brinquedo|jipe|triciclo)\b/i.test(norm);

  return {
    shortName,
    subMode,
    maleSubOption,
    niche,
    influencer,
    clientGender,
    watts: wattsMatch ? wattsMatch[1] : undefined,
    voltage: voltsMatch ? voltsMatch[1] : undefined,
    capacityMl: mlMatch ? mlMatch[1] : undefined,
    inches: inchesMatch ? inchesMatch[1] : undefined,
    kitQuantity: kitQty,
    colors,
    material: foundMaterial,
    isExpensive,
    isKidsProduct,
    keyFacts,
  };
}

/**
 * SEÇÃO 5.3 / PARTE B — Corta copy longa preservando: (1) Gancho, (2) Prova principal ("olha..."), (3) CTA completo.
 * Para copy do banco em 8s > 199 chars, encurta apenas o suficiente para ficar entre 185 e 195 chars.
 */
export function enforceMaxChars(copyText: string, maxChars: number, minTargetChars = 185): string {
  const clean = copyText.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [clean];
  if (sentences.length <= 1) {
    return clean.slice(0, maxChars - 1).replace(/[,;:\s]+$/, '') + '!';
  }

  const hook = sentences[0];
  const cta = sentences[sentences.length - 1];
  const middle = sentences.slice(1, -1);

  // Tenta primeiro remover pequenos trechos acessórios ou frases curtas do meio mantendo o texto entre minTargetChars e maxChars
  const sortedMiddle = [...middle].sort((a, b) => {
    const scoreA = (/olha/i.test(a) ? 3 : 0) + (/\d/.test(a) ? 1 : 0);
    const scoreB = (/olha/i.test(b) ? 3 : 0) + (/\d/.test(b) ? 1 : 0);
    return scoreB - scoreA;
  });

  const keptMiddle: string[] = [];
  let currentLen = hook.length + 1 + cta.length;

  for (const m of sortedMiddle) {
    if (currentLen + 1 + m.length <= maxChars) {
      keptMiddle.push(m);
      currentLen += 1 + m.length;
    }
  }

  const orderedMiddle = middle.filter((m) => keptMiddle.includes(m));
  let candidate = [hook, ...orderedMiddle, cta].join(' ').replace(/\s+/g, ' ').trim();

  // Se ficou muito curto (< minTargetChars) porque uma frase do meio era longa demais, encurta a frase do meio em vez de descartá-la inteira
  if (candidate.length < minTargetChars && middle.length > 0) {
    const remainingMiddle = middle.find((m) => !keptMiddle.includes(m));
    if (remainingMiddle) {
      const clauses = remainingMiddle.split(/[,;–—]+/).map((c) => c.trim()).filter(Boolean);
      for (let k = clauses.length - 1; k >= 1; k--) {
        const partialMid = clauses.slice(0, k).join(', ') + '.';
        const testCand = [hook, ...orderedMiddle, partialMid, cta].join(' ').replace(/\s+/g, ' ').trim();
        if (testCand.length >= minTargetChars && testCand.length <= maxChars) {
          return testCand;
        }
      }
    }
  }

  if (candidate.length <= maxChars) {
    return candidate;
  }

  candidate = `${hook} ${cta}`.replace(/\s+/g, ' ').trim();
  if (candidate.length <= maxChars) {
    return candidate;
  }

  return clean.slice(0, maxChars - 1).replace(/[,;:\s]+$/, '') + '!';
}

/**
 * SEÇÃO 5.2 — Ajusta vocativo e concordância conforme gênero do cliente e influencer
 * Regra explícita do usuário: NUNCA usar "menina", preferir "Amiga" quando for produto destinado a mulher.
 */
export function applyGenderAndVocativeRules(
  text: string,
  clientGender: Produtos2ClientGender,
  influencer: 'Homem' | 'Mulher'
): string {
  let out = text;

  // Nunca usar "menina" / "meninas" como vocativo -> trocar sempre por "Amiga" / "Amigas"
  out = out.replace(/\bMeninas\s*,/gi, 'Amigas,');
  out = out.replace(/\bMenina\s*,/gi, 'Amiga,');
  out = out.replace(/\bmenina\b/gi, 'amiga');

  if (clientGender === 'Feminino') {
    out = out
      .replace(/^(Nossa,\s*)?Meu amigo\s*,/i, '$1Amiga,')
      .replace(/^(Nossa,\s*)?Cara\s*,/i, '$1Amiga,')
      .replace(/^(Nossa,\s*)?Irmão\s*,/i, '$1Amiga,')
      .replace(/^(Nossa,\s*)?E aí,\s*mano\s*,/i, '$1Amiga,');
  } else if (clientGender === 'Masculino') {
    out = out
      .replace(/^(Nossa,\s*)?Amiga\s*,/i, '$1Meu amigo,')
      .replace(/\bTá cansada\b/gi, 'Tá cansado')
      .replace(/\bcansada de\b/gi, 'cansado de');
  } else if (clientGender === 'Unissex') {
    out = out
      .replace(/^(Nossa,\s*)?Meu amigo\s*,/i, '$1Gente,')
      .replace(/^(Nossa,\s*)?Cara\s*,/i, '$1Gente,')
      .replace(/^(Nossa,\s*)?Irmão\s*,/i, '$1Gente,')
      .replace(/^(Nossa,\s*)?Amiga\s*,/i, '$1Gente,');
  }

  // Concordância de quem fala (influencer)
  if (influencer === 'Homem') {
    out = out.replace(/\bTô apaixonada\b/gi, 'Tô apaixonado');
    out = out.replace(/\bfiquei chocada\b/gi, 'fiquei chocado');
  } else {
    out = out.replace(/\bTô apaixonado\b/gi, 'Tô apaixonada');
    out = out.replace(/\bfiquei chocado\b/gi, 'fiquei chocada');
  }

  return out;
}

/**
 * Adiciona a expressão neutra "Nossa, " no início de todas as copies/falas
 * para servir de margem de corte do 1º segundo no Veo (onde o Veo exibe o frame do storyboard),
 * sem duplicar caso a fala já comece com "Nossa".
 */
export function ensureLeadingNossaPrefix(text: string): string {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  if (/^nossa\b/i.test(trimmed)) {
    return trimmed;
  }
  const loweredFirst =
    /^(Eu\b|TikTok\b|CPF\b|USB\b|LED\b|RGB\b|JBL\b|BML\b|Poco\b)/.test(trimmed)
      ? trimmed
      : trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return `Nossa, ${loweredFirst}`;
}

/**
 * PARTE C (Passo 1) — Traduz especificações técnicas de "Informações do Produto" em BENEFÍCIOS FALADOS
 * Nunca lista ficha técnica crua; escolhe no máximo 2 ou 3 pontos visuais/desejáveis e traduz em "característica + benefício".
 */
export function translateSpecsToSpokenBenefits(
  productName: string,
  productInfo: string,
  specs: ProductSpecsExtracted
): {
  benefit1WithOlha: string;
  benefit2: string;
  objectionOrUseCase: string;
} {
  const norm = normalizeAccents(`${productName} ${productInfo}`);

  // Caso específico: Banco de exercícios / musculação / fitness
  if (/\b(banco|supino|apoio scott|extensor|musculacao|abdominal)\b/i.test(norm)) {
    const hasScott = /scott/i.test(norm);
    const hasExtensor = /extensor/i.test(norm);
    const hasEspuma = /espuma/i.test(norm);
    const hasAco = /aco|triangular|antiderrapante/i.test(norm);
    const b1 =
      hasScott && hasExtensor
        ? 'Olha o apoio Scott e o extensor pra treinar braço e perna em casa'
        : hasScott
        ? 'Olha esse apoio Scott ajustável pra treinar braço completo'
        : 'Olha a regulagem de inclinação pra treinar peito e abdômen';
    const b2 =
      hasEspuma && hasAco
        ? 'com espuma macia que não machuca as costas e base de aço que não balança nada.'
        : hasEspuma
        ? 'com espuma grossa que não machuca as costas e estrutura super firme.'
        : 'com estrutura de aço reforçada que aguenta treino pesado sem balançar.';
    const obj = 'Você monta sua academia em casa sem pagar mensalidade cara.';
    return { benefit1WithOlha: b1, benefit2: b2, objectionOrUseCase: obj };
  }

  // Caso específico: Tinta / reforma / parede
  if (/\b(tinta|parede|pintura|acrilica|emborrachada)\b/i.test(norm)) {
    const b1 = 'Olha essa cobertura que fecha a parede já na primeira mão';
    const b2 = /lavavel|impermeavel|mofo/i.test(norm)
      ? 'não tem cheiro forte, seca rápido e é lavável pra limpar sem descascar.'
      : 'rende muito mais, seca rapidinho e deixa acabamento liso de profissional.';
    const obj = 'Você mesmo renova a casa inteira sem gastar uma fortuna com pintor.';
    return { benefit1WithOlha: b1, benefit2: b2, objectionOrUseCase: obj };
  }

  // Traduções genéricas inteligentes baseadas nas specs reais informadas
  const benefitParts: string[] = [];
  if (specs.watts) {
    benefitParts.push(`a potência de ${specs.watts} que dá conta do serviço pesado sem engasgar`);
  }
  if (specs.capacityMl) {
    benefitParts.push(`o espaço de ${specs.capacityMl} pra caber tudo de uma vez sem aperto`);
  }
  if (specs.material) {
    benefitParts.push(`o acabamento em ${specs.material} que não enferruja e dura anos`);
  }
  if (/bateria|recarregavel|sem fio/i.test(norm)) {
    benefitParts.push('a bateria que dura muito pra você usar em qualquer lugar sem fio');
  }
  if (/dobravel|compacto|portatil/i.test(norm)) {
    benefitParts.push('como ele dobra fácil pra guardar em qualquer cantinho sem ocupar espaço');
  }
  if (/antiderrapante|estavel|firme|seguro/i.test(norm)) {
    benefitParts.push('a base antiderrapante que fica firme e traz segurança total no uso');
  }
  if (/ajustavel|regulavel|inclinacao|niveis/i.test(norm)) {
    benefitParts.push('a regulagem fácil que se adapta certinho ao seu jeito de usar');
  }

  // Se ainda faltarem benefícios, extrai dos keyFacts transformando em benefício falado (sem despejar lista técnica)
  for (const fact of specs.keyFacts) {
    if (benefitParts.length >= 2) break;
    const cleanFact = fact.replace(/^[•*-]\s*/, '').replace(/\.$/, '').trim();
    if (cleanFact.length >= 8 && cleanFact.length <= 55) {
      benefitParts.push(`${cleanFact.charAt(0).toLowerCase() + cleanFact.slice(1)} que facilita demais a sua rotina`);
    }
  }

  const b1 = benefitParts[0]
    ? `Olha ${benefitParts[0]}`
    : `Olha o acabamento reforçado desse ${productName} que facilita demais o dia a dia`;

  const b2 = benefitParts[1]
    ? `e ainda conta com ${benefitParts[1].replace(/^a |^o |^como /, '')}.`
    : 'entrega resultado de nível profissional logo na primeira vez que você usa.';

  const obj = specs.isExpensive
    ? 'Pelo que entrega, em qualquer loja física custaria mais que o dobro do preço.'
    : 'Resolve seu problema na hora sem esforço e sem gastar caro.';

  return { benefit1WithOlha: b1, benefit2: b2, objectionOrUseCase: obj };
}

/**
 * PARTE E — Checklist de aprovação antes de entregar qualquer copy nova ou adaptada
 */
export function evaluateCopyDnaChecklist(copy: string, duration: Produtos2Duration): {
  passed: boolean;
  hasOlha: boolean;
  hasCompleteCta: boolean;
  isWithinWindow: boolean;
  score: number;
} {
  const clean = copy.replace(/\s+/g, ' ').trim();
  const hasOlha = /\bolha\b|\bolhem\b/i.test(clean);
  // Proibido terminar apenas com "Clica no carrinho." seco
  const isDryCta = /clica no carrinho\.?$/i.test(clean) && !/garante|aproveita|acaba|desconto|oferta|seu|sua|laranja|aqui embaixo/i.test(clean.slice(-45));
  const hasCompleteCta =
    !isDryCta &&
    /\b(carrinho|aqui embaixo|link|garante|aproveita|estoque|oferta|promoção|desconto|parcela)\b/i.test(clean.slice(-85));

  const minTarget = duration === 8 ? 185 : 242;
  const maxTarget = duration === 8 ? 195 : 250;
  const hardMax = duration === 8 ? 199 : 252;
  const idealTarget = duration === 8 ? 195 : 250;

  const isWithinWindow = clean.length >= minTarget && clean.length <= maxTarget;
  const distanceToIdeal = Math.abs(idealTarget - clean.length);

  let score = 100 - distanceToIdeal * 3;
  if (!hasOlha) score -= 50;
  if (!hasCompleteCta) score -= 50;
  if (clean.length < minTarget) score -= (minTarget - clean.length) * 6;
  if (clean.length > maxTarget) score -= (clean.length - maxTarget) * 5;
  if (clean.length > hardMax) score -= (clean.length - hardMax) * 15;
  if (isWithinWindow) score += 25;

  return {
    passed: hasOlha && hasCompleteCta && isWithinWindow,
    hasOlha,
    hasCompleteCta,
    isWithinWindow,
    score,
  };
}

/**
 * PARTE B — Calibra o tamanho exato da copy (contando espaços e o prefixo "Nossa, "):
 * - Copy do BANCO (mesmo produto):
 *   - 10s: usa como está (não encurta).
 *   - 8s: se <= 199 chars, usa como está; se > 199 chars, encurta apenas até entrar na janela 185–195 (máx 199).
 * - Copy NOVA ou ADAPTADA para outro produto do nicho:
 *   - 8s: janela obrigatória 185 a 195 chars (máx absoluto 199, ideal 195).
 *   - 10s: janela obrigatória 242 a 250 chars (máx absoluto 252, ideal 250).
 */
export function calibrateCopyToTargetWindow(params: {
  copy: string;
  duration: Produtos2Duration;
  isSameProductBankCopy: boolean;
  clientGender: Produtos2ClientGender;
  influencer: 'Homem' | 'Mulher';
}): string {
  const { duration, isSameProductBankCopy, clientGender, influencer } = params;
  let text = ensureLeadingNossaPrefix(
    applyGenderAndVocativeRules(params.copy.replace(/\s+/g, ' ').trim(), clientGender, influencer)
  );

  // Regra para Copy do BANCO (exatamente o mesmo produto)
  if (isSameProductBankCopy) {
    if (duration === 10) {
      return text; // Em 10s, NUNCA encurtar copy do banco
    }
    // Em 8s: se <= 199 chars, usar como está; se > 199, encurtar apenas até entrar em 185–195 (máx 199)
    if (text.length <= 199) {
      return text;
    }
    return ensureLeadingNossaPrefix(enforceMaxChars(text, 195, 185));
  }

  // Regra para Copy NOVA ou ADAPTADA (produto diferente do banco)
  const minChars = duration === 8 ? 185 : 242;
  const targetMax = duration === 8 ? 195 : 250;

  // 1. Garantir que nunca termine com "Clica no carrinho." seco (Parte C item 6)
  text = text.replace(/\bClica no carrinho\.?$/i, 'Clica no carrinho e garante o seu!');
  text = text.replace(/\bClique no carrinho\.?$/i, 'Clica no carrinho e garante o seu!');

  // 2. Garantir que tenha "olha" se não tiver
  if (!/\bolha\b|\bolhem\b/i.test(text)) {
    const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [text];
    if (sentences.length >= 2) {
      sentences[1] = `Olha a qualidade: ${sentences[1].charAt(0).toLowerCase() + sentences[1].slice(1)}`;
      text = sentences.join(' ');
    }
  }

  // Se já está cravado na janela [minChars, targetMax] e tem CTA completo, retorna!
  const initialCheck = evaluateCopyDnaChecklist(text, duration);
  if (initialCheck.passed) {
    return text;
  }

  // 3. Ajustar o CTA ou frases de reforço para cair exatamente na janela [minChars, targetMax] (priorizando mais perto de targetMax)
  const ctaVariants = [
    'Garante no carrinho!',
    'Aproveita no carrinho!',
    'Garante já no carrinho!',
    'Clica e garante no carrinho!',
    'Corre e garante no carrinho!',
    'Garante o seu no carrinho!',
    'Clica no carrinho e garante!',
    'Clica no carrinho e aproveita!',
    'Aproveita e garante no carrinho!',
    'Corre no carrinho e garante já!',
    'Clica no carrinho e garante o seu!',
    'Corre no carrinho e garante o seu!',
    'Clica no carrinho laranja e garante!',
    'Aproveita a oferta aqui no carrinho!',
    'Clica aqui no carrinho e garante já!',
    'Clica aqui no carrinho e garante o seu!',
    'Clica no carrinho laranja e garante já!',
    'Clica aqui embaixo no carrinho e garante!',
    'Clica no carrinho laranja e garante o seu!',
    'Aproveita o desconto e garante no carrinho!',
    'Clica aqui embaixo no carrinho e aproveita!',
    'Clica aqui embaixo no carrinho e garante já!',
    'Clica aqui embaixo no carrinho e garante o seu!',
    'Corre, clica no carrinho laranja e garante o seu!',
    'Aproveita e clica aqui embaixo no carrinho laranja!',
    'Corre, clica no carrinho laranja e garante o seu agora!',
    'Aproveita a promoção, clica no carrinho e garante o seu!',
    'Aproveita a promoção, clica no carrinho laranja e garante o seu!',
    'Não perde tempo, clica aqui embaixo no carrinho e garante o seu!',
    'Não perde tempo, clica aqui embaixo no carrinho laranja e garante o seu!',
  ];

  const reinforcementBoosters = [
    'Vale muito!',
    'É bom demais!',
    'Zero esforço!',
    'Vale cada centavo!',
    'É prático demais!',
    'Não estraga por nada!',
    'Dura por muitos anos!',
    'Acabamento impecável!',
    'Qualidade de outro nível!',
    'Surpreendeu demais mesmo!',
    'Compensa cada centavo pago!',
    'Surpreendeu demais na qualidade!',
    'Quem compra não se arrepende nunca!',
    'Quem compra não se arrepende por nada!',
    'Pelo que entrega, tá barato demais mesmo!',
    'A qualidade impressiona logo no primeiro uso!',
  ];

  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [text];
  if (sentences.length >= 2) {
    const bodyWithoutCta = sentences.slice(0, -1).join(' ').trim();
    let bestCandidate = '';
    let bestScore = -9999;

    // Passo A: Testar troca direta de CTA sobre o corpo atual
    for (const cta of ctaVariants) {
      const cand = `${bodyWithoutCta} ${cta}`.replace(/\s+/g, ' ').trim();
      if (cand.length >= minChars && cand.length <= targetMax) {
        const score = 1000 - (targetMax - cand.length);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      }
    }

    // Passo B: Se o corpo + menor CTA ainda passa de targetMax, tenta encurtar levemente o corpo preservando a frase com "Olha"
    if (!bestCandidate && `${bodyWithoutCta} ${ctaVariants[0]}`.length > targetMax) {
      const bodySentences = sentences.slice(0, -1);
      // Tenta podar a última cláusula ou frase de objeção preservando Gancho (frase 0) e a frase com "Olha"
      const hookSent = bodySentences[0];
      const olhaSent = bodySentences.find((s, i) => i > 0 && /\bolha\b/i.test(s)) || bodySentences[1] || '';
      const compactBodies: string[] = [];
      if (olhaSent && olhaSent !== hookSent) {
        compactBodies.push(`${hookSent} ${olhaSent}`);
        // Também testa versões com cláusula reduzida de olhaSent se ela tiver vírgula ou " e "
        const subClauses = olhaSent.split(/,\s*|\s+e\s+(?=base|estrutura|nao|seca|ainda)/i);
        if (subClauses.length > 1) {
          compactBodies.push(`${hookSent} ${subClauses[0].replace(/[.!?]+$/, '')}.`);
        }
      } else {
        compactBodies.push(hookSent);
      }

      for (const cBody of compactBodies) {
        for (const cta of ctaVariants) {
          const cand = `${cBody} ${cta}`.replace(/\s+/g, ' ').trim();
          if (cand.length >= minChars && cand.length <= targetMax && /\bolha\b/i.test(cand)) {
            const score = 1000 - (targetMax - cand.length);
            if (score > bestScore) {
              bestScore = score;
              bestCandidate = cand;
            }
          }
        }
        for (const booster of reinforcementBoosters) {
          for (const cta of ctaVariants) {
            const cand = `${cBody} ${booster} ${cta}`.replace(/\s+/g, ' ').trim();
            if (cand.length >= minChars && cand.length <= targetMax && /\bolha\b/i.test(cand)) {
              const score = 1000 - (targetMax - cand.length);
              if (score > bestScore) {
                bestScore = score;
                bestCandidate = cand;
              }
            }
          }
        }
      }
    }

    // Passo C: Se o corpo é curto (< minChars), testar inserindo 1 ou 2 reforços do DNA antes do CTA + variante de CTA
    if (!bestCandidate) {
      for (const booster of reinforcementBoosters) {
        for (const cta of ctaVariants) {
          const cand = `${bodyWithoutCta} ${booster} ${cta}`.replace(/\s+/g, ' ').trim();
          if (cand.length >= minChars && cand.length <= targetMax) {
            const score = 1000 - (targetMax - cand.length);
            if (score > bestScore) {
              bestScore = score;
              bestCandidate = cand;
            }
          }
        }
      }
    }

    if (!bestCandidate) {
      for (const bA of reinforcementBoosters) {
        for (const bB of reinforcementBoosters) {
          if (bA === bB) continue;
          for (const cta of ctaVariants) {
            const cand = `${bodyWithoutCta} ${bA} ${bB} ${cta}`.replace(/\s+/g, ' ').trim();
            if (cand.length >= minChars && cand.length <= targetMax) {
              const score = 1000 - (targetMax - cand.length);
              if (score > bestScore) {
                bestScore = score;
                bestCandidate = cand;
              }
            }
          }
        }
      }
    }

    if (bestCandidate) {
      return bestCandidate;
    }
  }

  // Fallback seguro caso a estrutura seja de frase única
  if (text.length > targetMax) {
    return ensureLeadingNossaPrefix(enforceMaxChars(text, targetMax, minChars));
  }
  return text;
}

/**
 * PARTES C, D, E e F — Cria ou adapta copy para produto novo / produto do mesmo nicho
 * usando a estrutura fixa de 6 partes do DNA, traduzindo características em benefícios,
 * gerando 3 versões internas baseadas no molde e escolhendo a que crava a janela de caracteres
 * (185–195 em 8s; 242–250 em 10s).
 */
export function buildFormulaCopyForNewProduct(params: {
  productName: string;
  productInfo: string;
  specs: ProductSpecsExtracted;
  clientGender: Produtos2ClientGender;
  influencer: 'Homem' | 'Mulher';
  duration: Produtos2Duration;
  moldEntry?: CopyBankEntry;
}): { copy: string; archetype: CopyArchetype; moldId: string } {
  const { productName, productInfo, specs, clientGender, influencer, duration, moldEntry } = params;

  const vocative =
    clientGender === 'Feminino'
      ? 'Amiga'
      : clientGender === 'Masculino'
      ? 'Meu amigo'
      : 'Gente';

  const { benefit1WithOlha, benefit2, objectionOrUseCase } = translateSpecsToSpokenBenefits(
    productName,
    productInfo,
    specs
  );

  const spokenProd = productName.toLowerCase();
  const isFeminineNoun =
    /^(tinta|esteira|bicicleta|scooter|garrafa|garrafinha|panificadora|air\s*fryer|fritadeira|panela|rocadeira|escova|chapinha|prancha|palmilha|luva|saia|toalha|camera|bateria|parafusadeira|furadeira|puncao|pedaleira|camisa|camiseta|bermuda|calca|bota|sandalia|chuteira|cadeirinha|capa|placa|pastilha|vara|linha)\b/i.test(
      normalizeAccents(spokenProd)
    );
  const prodWithDemonstrative = isFeminineNoun ? `essa ${spokenProd}` : `esse ${spokenProd}`;
  const prodWithGenitive = isFeminineNoun ? `dessa ${spokenProd}` : `desse ${spokenProd}`;

  let archetype: CopyArchetype = moldEntry?.archetype || 'Achado/Demonstração';
  let moldId = moldEntry?.id || 'FIT-02';

  if (!moldEntry) {
    if (specs.kitQuantity && specs.kitQuantity >= 2) {
      archetype = 'Kit/Valor';
      moldId = 'CLI-03';
    } else if (specs.isKidsProduct) {
      archetype = 'Emoção/Presente';
      moldId = 'INF-01';
    } else if (specs.isExpensive) {
      archetype = 'Choque de preço/Urgência';
      moldId = 'FIT-02';
    } else {
      archetype = 'Dor→Solução';
      moldId = 'BEL-02';
    }
  }

  // Gerar 3 versões internas completas seguindo as 6 partes do DNA:
  // [1. GANCHO] -> [2. APRESENTA COM EMOÇÃO] -> [3. "OLHA" + BENEFÍCIO 1] -> [4. BENEFÍCIO 2] -> [5. OBJEÇÃO/USO] -> [6. CTA COMPLETO]
  const rawVersions: string[] =
    duration === 8
      ? [
          // 8s Versão 1: Gancho Choque de Preço / Urgência (Molde FIT-02 / ELE-06)
          `O TikTok perdeu o juízo e derrubou ${prodWithDemonstrative}! ${benefit1WithOlha}, ${benefit2} Clica no carrinho e garante!`,
          // 8s Versão 2: Gancho Conversa Direta / Descoberta (Molde FIT-01 / GAR-04)
          `${vocative}, que achado absurdo ${prodWithDemonstrative}! ${benefit1WithOlha}, ${benefit2} Clica no carrinho e garante!`,
          // 8s Versão 3: Gancho Dor -> Solução / Inconformismo (Molde BEL-02 / PES-02)
          `${vocative}, quer resultado real sem gastar caro? ${benefit1WithOlha}, ${benefit2} Clica no carrinho e garante!`,
        ]
      : [
          // 10s Versão 1: Gancho Choque de Preço / Urgência (Molde FIT-02 / ELE-06)
          `O TikTok perdeu o juízo, baixou demais o preço ${prodWithGenitive}! ${benefit1WithOlha}, ${benefit2} ${objectionOrUseCase} Corre no carrinho e garante!`,
          // 10s Versão 2: Gancho Conversa Direta / Descoberta (Molde FIT-01 / GAR-04)
          `${vocative}, que achado absurdo ${prodWithDemonstrative} que acabou de chegar! ${benefit1WithOlha}, ${benefit2} ${objectionOrUseCase} Clica no carrinho e garante!`,
          // 10s Versão 3: Gancho Dor -> Solução / Inconformismo (Molde BEL-02 / PES-02)
          `${vocative}, quer praticidade de verdade sem gastar caro? ${benefit1WithOlha}, ${benefit2} ${objectionOrUseCase} Clica no carrinho e garante!`,
        ];

  // Calibrar cada uma das 3 versões para a janela exata (185–195 em 8s, 242–250 em 10s) e avaliar pelo Checklist da Parte E
  const calibratedCandidates = rawVersions.map((raw) => {
    const calibrated = calibrateCopyToTargetWindow({
      copy: raw,
      duration,
      isSameProductBankCopy: false,
      clientGender,
      influencer,
    });
    const check = evaluateCopyDnaChecklist(calibrated, duration);
    return { calibrated, check };
  });

  // Ordena pelas que passaram no checklist e têm maior score (mais perto de 195 em 8s ou 250 em 10s)
  calibratedCandidates.sort((a, b) => b.check.score - a.check.score);

  return {
    copy: calibratedCandidates[0].calibrated,
    archetype,
    moldId,
  };
}

export function selectAndAdaptProdutos2Copy(params: {
  subMode: Produtos2SubMode;
  maleSubOption: Produtos2MaleSubOption;
  productName: string;
  productInfo: string;
  duration: Produtos2Duration;
  customCopy?: string;
  clientGender: Produtos2ClientGender;
  influencer: Produtos2Influencer;
}): {
  finalCopy: string;
  copyId: string;
  copySourceLabel: string;
  archetype: CopyArchetype;
  resolvedInfluencer: 'Homem' | 'Mulher';
  isSameProductBankCopy: boolean;
  baseEntry?: CopyBankEntry;
} {
  const {
    subMode,
    maleSubOption,
    productName,
    productInfo,
    duration,
    customCopy,
    clientGender,
    influencer,
  } = params;

  const specs = analyzeProductInfoForProdutos2(`${productName} ${productInfo}`);
  const cleanName = (productName || specs.shortName || 'produto').trim();
  const normCombined = normalizeAccents(`${cleanName} ${productInfo}`);

  // Se o usuário preencheu copy personalizada (Seção 5.4)
  if (customCopy && customCopy.trim().length > 0) {
    const resolvedInf: 'Homem' | 'Mulher' =
      influencer || specs.influencer || (clientGender === 'Masculino' ? 'Homem' : 'Mulher');
    let finalCustom = ensureLeadingNossaPrefix(customCopy.trim());
    if (duration === 8 && finalCustom.length > 199) {
      finalCustom = ensureLeadingNossaPrefix(enforceMaxChars(finalCustom, 195, 185));
    }
    return {
      finalCopy: finalCustom,
      copyId: 'CUSTOM',
      copySourceLabel: 'Copy personalizada informada pelo usuário',
      archetype: 'Achado/Demonstração',
      resolvedInfluencer: resolvedInf,
      isSameProductBankCopy: true,
    };
  }

  // Selecionar banco ativo (Seção 1 e 4.1)
  const activeBank: CopyBankEntry[] =
    subMode === 'vestuario_masculino'
      ? maleSubOption === 'calcados'
        ? COPIES_CALCADOS_MASCULINOS
        : COPIES_ROUPAS_MASCULINAS
      : COPIES_PRODUTOS_GERAIS;

  // Prioridade 1: Mesmo produto no banco ativo
  let candidates = activeBank.filter((entry) => {
    const entryTypeNorm = normalizeAccents(entry.productType);
    const nameNorm = normalizeAccents(cleanName);
    if (nameNorm && (entryTypeNorm.includes(nameNorm) || nameNorm.includes(entryTypeNorm))) {
      return true;
    }
    return entry.keywords.some((kw) => {
      const kwNorm = normalizeAccents(kw);
      return kwNorm.length > 3 && new RegExp(`\\b${kwNorm}\\b`, 'i').test(normCombined);
    });
  });

  if (specs.kitQuantity && specs.kitQuantity >= 2) {
    const kitCandidates = candidates.filter((c) => c.archetype === 'Kit/Valor' || /kit|dois|2|4/i.test(c.productType));
    if (kitCandidates.length > 0) {
      candidates = kitCandidates;
    }
  } else if (candidates.length > 1) {
    const singleCandidates = candidates.filter((c) => c.archetype !== 'Kit/Valor');
    if (singleCandidates.length > 0) {
      candidates = singleCandidates;
    }
  }

  let matchPriority: 'mesmo_produto' | 'mesmo_nicho' | 'nicho_vizinho' | 'nova_formula' = 'mesmo_produto';

  // Prioridade 2: Mesmo nicho no banco ativo (ex: Banco de exercícios -> Fitness -> FIT-01 / FIT-02)
  if (candidates.length === 0) {
    candidates = activeBank.filter((entry) => entry.niche === specs.niche);
    if (candidates.length > 0) {
      matchPriority = 'mesmo_nicho';
    }
  }

  // Prioridade 3: Nicho vizinho (Tabela 4.3)
  if (candidates.length === 0 && subMode === 'produtos_geral') {
    for (const rule of NEIGHBOR_NICHE_RULES) {
      if (rule.keywords.some((kw) => normCombined.includes(normalizeAccents(kw)))) {
        candidates = COPIES_PRODUTOS_GERAIS.filter((e) => rule.targetNiches.includes(e.niche));
        if (candidates.length > 0) {
          matchPriority = 'nicho_vizinho';
          break;
        }
      }
    }
  }

  if (candidates.length > 0) {
    let pool = candidates;
    if (duration === 8 && matchPriority === 'mesmo_produto') {
      const shortPool = candidates.filter((c) => c.fits8s || ensureLeadingNossaPrefix(c.text).length <= 199);
      if (shortPool.length > 0) {
        pool = shortPool;
      } else {
        const sortedByLen = [...candidates].sort((a, b) => a.text.length - b.text.length);
        pool = [sortedByLen[0]];
      }
    }

    const chosen = pickUniformRandom(pool);
    const resolvedInf: 'Homem' | 'Mulher' =
      influencer ||
      specs.influencer ||
      (chosen.audience === 'Masculino' ? 'Homem' : 'Mulher');

    // Se for o MESMO PRODUTO do banco (Prioridade 1), preserva a copy validada 99% intacta
    if (matchPriority === 'mesmo_produto') {
      const adaptedSame = calibrateCopyToTargetWindow({
        copy: adaptBankCopyToProduct(chosen, cleanName, productInfo, specs, clientGender, resolvedInf),
        duration,
        isSameProductBankCopy: true,
        clientGender,
        influencer: resolvedInf,
      });

      return {
        finalCopy: adaptedSame,
        copyId: chosen.id,
        copySourceLabel: `Copy ${chosen.id} (${chosen.productType}) — Nicho: ${chosen.niche}`,
        archetype: chosen.archetype,
        resolvedInfluencer: resolvedInf,
        isSameProductBankCopy: true,
        baseEntry: chosen,
      };
    }

    // Se for Prioridade 2 ou 3 (outro produto do mesmo nicho ou nicho vizinho, ex: Banco de exercícios no nicho Fitness):
    // Usa a copy sorteada do nicho como MOLDE e gera 3 versões internas seguindo o DNA das Copies (Partes C, D, E, F)
    const moldedResult = buildFormulaCopyForNewProduct({
      productName: cleanName,
      productInfo,
      specs,
      clientGender,
      influencer: resolvedInf,
      duration,
      moldEntry: chosen,
    });

    const sourceDesc =
      matchPriority === 'mesmo_nicho'
        ? `Copy ${chosen.id} adaptada como Molde — Mesmo Nicho: ${chosen.niche}`
        : `Copy ${chosen.id} adaptada como Molde — Nicho vizinho: ${chosen.niche}`;

    return {
      finalCopy: moldedResult.copy,
      copyId: chosen.id,
      copySourceLabel: sourceDesc,
      archetype: chosen.archetype,
      resolvedInfluencer: resolvedInf,
      isSameProductBankCopy: false,
      baseEntry: chosen,
    };
  }

  // Prioridade 4: Nenhum parecido -> Criar copy nova seguindo o DNA das Copies (Partes C, D, E, F) com 3 versões internas
  const resolvedInf: 'Homem' | 'Mulher' =
    influencer || specs.influencer || (clientGender === 'Masculino' ? 'Homem' : 'Mulher');

  const formulaResult = buildFormulaCopyForNewProduct({
    productName: cleanName,
    productInfo,
    specs,
    clientGender,
    influencer: resolvedInf,
    duration,
  });

  return {
    finalCopy: formulaResult.copy,
    copyId: `NOVA-${formulaResult.archetype.slice(0, 3).toUpperCase()}`,
    copySourceLabel: `Copy nova gerada pelo DNA — Arquétipo: ${formulaResult.archetype} (Molde: ${formulaResult.moldId})`,
    archetype: formulaResult.archetype,
    resolvedInfluencer: resolvedInf,
    isSameProductBankCopy: false,
  };
}

/**
 * SEÇÃO 5 — Adapta copy do banco para o MESMO produto mudando o MÍNIMO possível
 */
function adaptBankCopyToProduct(
  entry: CopyBankEntry,
  productName: string,
  productInfo: string,
  specs: ProductSpecsExtracted,
  clientGender: Produtos2ClientGender,
  influencer: 'Homem' | 'Mulher'
): string {
  let text = entry.text;

  // Atualizar números/especificações reais se presentes nas Informações do Produto (Seção 5.1)
  if (specs.watts) {
    text = text.replace(/\b\d+\s*(?:W\s*RMS|watts\s*RMS|watts|W)\b/i, specs.watts);
  }
  if (specs.capacityMl) {
    text = text.replace(/\b\d+\s*ml\b/i, specs.capacityMl);
  }
  if (specs.inches) {
    text = text.replace(/\b\d+\s*(?:polegadas|cm)\b/i, specs.inches);
  }

  // Ajustar vocativos e concordância (Seção 5.2 - usando Amiga para Feminino, nunca menina)
  text = applyGenderAndVocativeRules(text, clientGender, influencer);

  return text;
}
