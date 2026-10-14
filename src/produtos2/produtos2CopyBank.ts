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
    charCount: 224,
    fits8s: false,
    text: 'Gente, se você pesca, olha a leveza dessa vara de carbono. Ponta ultralight e carbono que aguenta a briga. O cabo em EVA garante arremesso preciso sem cansar a mão. Olha o acabamento premium, o preço tá ridículo no carrinho.',
  },
  {
    id: 'PES-02',
    bank: 'geral',
    niche: 'Pesca',
    productType: 'Vara de pescar',
    keywords: ['vara de pescar', 'vara de pesca', 'vara de carbono', 'vara ultralight'],
    archetype: 'Unboxing/Chegou',
    audience: 'Masculino',
    charCount: 229,
    fits8s: false,
    text: 'Gente, finalmente chegou a vara de carbono ultralight que eu tanto queria testar. Olha a flexibilidade e a sensibilidade dessa ponta com ação rápida. Leve demais para pescar o dia todo sem cansar o braço. Equipamento sensacional.',
  },
  {
    id: 'PES-03',
    bank: 'geral',
    niche: 'Pesca',
    productType: 'Vara de pescar',
    keywords: ['vara de pescar', 'vara de pesca', 'vara de carbono', 'vara ultralight'],
    archetype: 'Achado/Demonstração',
    audience: 'Masculino',
    charCount: 220,
    fits8s: false,
    text: 'Gente, olha a sensibilidade dessa vara de carbono ultralight que acabou de chegar. Ação sensacional, verga sem quebrar e sente até a mordida mais fraca. Perfeita para piapara e tilápia. Corre para o link e garante a sua.',
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
    charCount: 203,
    fits8s: false,
    text: 'Chega de nadar cego e perder protetor de ouvido. Olha isso! O protetor já vem embutido na tira, não perde nunca. Lente antiembaçante com visão cristalina e fecho que não puxa o cabelo. Clica no carrinho.',
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
    text: 'Baixou o preço do amplificador mais vendido aqui do TikTok Shop. Clica no carrinho laranja pra você desbloquear a oferta relâmpago e já finaliza pra você não perder esse super desconto. Mas atenção, é só até meia-noite, tá?',
  },
  {
    id: 'SOM-03',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Alto-falante',
    keywords: ['alto-falante', 'alto falante', 'autofalante', 'subwoofer', 'som automotivo'],
    archetype: 'Achado/Demonstração',
    audience: 'Masculino',
    charCount: 216,
    fits8s: false,
    text: 'A qualidade de som desse alto-falante não combina com esse valor. Carcaça metálica robusta e batidas muito potentes. Liga no som máximo e não distorce nada, som limpo de cinema no seu carro. Pega no carrinho laranja.',
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
  {
    id: 'SOM-10',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Caixa de som bluetooth / Alto-falante',
    keywords: ['caixa de som', 'caixa bluetooth', 'alto-falante', 'alto falante', 'autofalante', 'speaker', 'som portatil'],
    archetype: 'Achado/Demonstração',
    audience: 'Unissex',
    charCount: 160,
    fits8s: true,
    text: 'Olha a potência desse alto-falante portátil! Grave pesado, bateria que dura horas e conecta no bluetooth num segundo. Leva sua música para qualquer lugar, garanta o seu.',
  },
  {
    id: 'SOM-11',
    bank: 'geral',
    niche: 'Som automotivo',
    productType: 'Caixa de som potente',
    keywords: ['caixa de som', 'alto-falante', 'alto falante', 'autofalante', 'soundbar', 'subwoofer'],
    archetype: 'Especificação',
    audience: 'Unissex',
    charCount: 155,
    fits8s: true,
    text: 'Som limpo, sem distorção e com aquele grave que faz tremer tudo. Esse alto-falante entrega qualidade profissional num design compacto. Clica no link e aproveite!',
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
    keywords: ['panificadora', 'maquina de pao', 'maquina de fazer pao'],
    archetype: 'Unboxing/Chegou',
    audience: 'Unissex',
    charCount: 225,
    fits8s: false,
    text: 'Gente, olha essa loucura! Todo mundo correndo pra panificadora! Acabei de trazer pra casa, são 19 programas automáticos que fazem tudo sozinha. Corre pro carrinho agora, esse modelo esgota num piscar de olhos, não fiquem sem!',
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
    charCount: 222,
    fits8s: false,
    notes: 'Estilo POV.',
    text: 'Gente, achei a garrafinha mais estética e perfeita pra levar na bolsa. Tamanho ideal de 400 ml, sustentável e com essa tampa brilhante incrível. Veda perfeitamente sem vazar nada. Clica aqui embaixo pra escolher a sua cor.',
  },
  {
    id: 'GAR-02',
    bank: 'geral',
    niche: 'Garrafas e copos',
    productType: 'Garrafinha',
    keywords: ['garrafinha', 'garrafa de agua', 'squeeze'],
    archetype: 'Achado/Demonstração',
    audience: 'Feminino',
    charCount: 208,
    fits8s: false,
    text: 'Gente, achei a garrafinha mais linda e sustentável pro meu dia a dia. Alça super prática de carregar e tampa metálica com vedação que não vaza nem pega cheiro. Perfeita pro trabalho e pra academia. Recomendo!',
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
    charCount: 205,
    fits8s: false,
    text: 'Gente, achei a garrafa térmica mais estilosa e perfeita para o dia a dia. Aço inox por dentro, mantém o gelo o dia todo e não vaza uma gota na bolsa de jeito nenhum. Clica aqui embaixo para escolher a sua.',
  },

  // Nicho: Jardim
  {
    id: 'JAR-01',
    bank: 'geral',
    niche: 'Jardim',
    productType: 'Pulverizador elétrico',
    keywords: ['pulverizador eletrico', 'pulverizador', 'borrifador eletrico'],
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
    keywords: ['educador pet', 'spray pet', 'xixi no lugar certo', 'adestrador xixi'],
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
    keywords: ['elastico de cabelo', 'xuxinha', 'prendedor de cabelo', 'scrunchie'],
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
    keywords: ['escova alisadora', 'escova chapinha', 'escova secadora', 'escova de ceramica'],
    archetype: 'Dor→Solução',
    audience: 'Feminino',
    charCount: 205,
    fits8s: false,
    text: 'Adeus, chapinha que queima a testa. Olha essa escova de cerâmica. Esquenta muito rápido, alisa desde a raiz sem puxar os fios e vem com suporte seguro pra apoiar na mesa. Clica no carrinho e garante a sua.',
  },

  // Nicho: Casa, banheiro e organização
  {
    id: 'CAS-01',
    bank: 'geral',
    niche: 'Casa, banheiro e organização',
    productType: 'Armário / rack de banheiro',
    keywords: ['armario de banheiro', 'rack de banheiro', 'rack de chao', 'organizador de banheiro'],
    archetype: 'Dor→Solução',
    audience: 'Feminino',
    charCount: 220,
    fits8s: false,
    text: 'Falta espaço no banheiro e você não pode furar o azulejo? Olha isso! Rack de chão super reforçado que aproveita o espaço sobre o vaso sem bambear. Cabe tudo e deixa sua pia livre. Garante o seu na cor preta aqui no link.',
  },
  {
    id: 'CAS-02',
    bank: 'geral',
    niche: 'Casa, banheiro e organização',
    productType: 'Pastilha para vaso sanitário',
    keywords: ['pastilha vaso sanitario', 'pastilha sanitaria', 'bloco sanitario', 'gel sanitario'],
    archetype: 'Unboxing/Chegou',
    audience: 'Feminino',
    charCount: 192,
    fits8s: false,
    text: 'Chegou meu kit de pastilhas pra vaso sanitário do TikTok Shop! Cheirinho maravilhoso logo que abre e espuma ativa limpando tudinho sem você precisar ficar esfregando o vaso sanitário todo dia.',
  },
  {
    id: 'CAS-03',
    bank: 'geral',
    niche: 'Casa, banheiro e organização',
    productType: 'Placa de número para casa',
    keywords: ['placa de casa', 'placa de numero', 'numero residencial', 'placa de endereco'],
    archetype: 'Achado/Demonstração',
    audience: 'Unissex',
    charCount: 224,
    fits8s: false,
    text: 'Finalmente os entregadores vão achar minha casa, e com muito estilo. Olha a qualidade: acabamento espelhado e letras em relevo. Fácil de instalar, transforma a fachada na hora. Clica no link pra fazer a sua com seu endereço.',
  },

  // Nicho: Casa, lazer e descanso
  {
    id: 'RED-01',
    bank: 'geral',
    niche: 'Casa, lazer e descanso',
    productType: 'Rede de descanso',
    keywords: ['rede de descanso', 'rede de dormir', 'rede casal', 'rede solteiro', 'rede compacta', 'rede de algodao', 'rede'],
    archetype: 'Achado/Demonstração',
    audience: 'Unissex',
    charCount: 204,
    fits8s: false,
    text: 'Olha que delícia de achado! Essa rede de descanso é feita em 100% algodão, super macia, resistente e cabe com conforto total. Perfeita pra relaxar na varanda e tirar aquele cochilo. Clica no carrinho e garante a sua!',
  },
  {
    id: 'RED-02',
    bank: 'geral',
    niche: 'Casa, lazer e descanso',
    productType: 'Rede de descanso',
    keywords: ['rede de descanso', 'rede de dormir', 'rede casal', 'rede solteiro', 'rede compacta', 'rede de algodao', 'rede'],
    archetype: 'Dor→Solução',
    audience: 'Unissex',
    charCount: 174,
    fits8s: true,
    text: 'Quer descansar de verdade e tirar aquele cochilo gostoso? Essa rede em algodão reforçado é puro conforto, não esquenta e aguenta o tranco. Clica aqui embaixo e garante a sua!',
  },

  // Nicho: Moto e acessórios automotivos
  {
    id: 'MOT-01',
    bank: 'geral',
    niche: 'Moto e acessórios automotivos',
    productType: 'Capa de moto',
    keywords: ['capa de moto', 'capa impermeavel moto', 'capa para moto'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 211,
    fits8s: false,
    text: 'Se você deixa sua moto no tempo, olha o que acabou de chegar. Capa grossa super resistente: bateu a chuva a água escorre na hora, zero chance de ferrugem. Do P ao GG, protege sua guerreira clicando aqui embaixo.',
  },

  // Nicho: Conforto para os pés
  {
    id: 'PES2-01',
    bank: 'geral',
    niche: 'Conforto para os pés',
    productType: 'Palmilha de gel',
    keywords: ['palmilha de gel', 'palmilha ortopedica', 'palmilha'],
    archetype: 'Dor→Solução',
    audience: 'Unissex',
    charCount: 213,
    fits8s: false,
    text: 'Gente, quem trabalha em pé o dia todo precisa ver isso. Olha a grossura desse gel: absorve o impacto e transforma qualquer sapato duro num conforto surreal. Vem dois pares, clica aqui embaixo para salvar seus pés.',
  },

  // Nicho: Limpeza e descartáveis
  {
    id: 'LIM-01',
    bank: 'geral',
    niche: 'Limpeza e descartáveis',
    productType: 'Luva descartável',
    keywords: ['luva descartavel', 'luva vinil', 'luva nitrilica', 'viniflex'],
    archetype: 'Dor→Solução',
    audience: 'Feminino',
    charCount: 226,
    fits8s: false,
    text: 'Tá cansada daquelas luvas que rasgam por qualquer coisinha? Olha a resistência da Viniflex! Ajuste perfeito, sem aquele pó chato e com máxima sensibilidade. Serve pra tudo e vem 100 unidades. Clica no carrinho e garante a sua.',
  },

  // Nicho: Festa e decoração
  {
    id: 'FES-01',
    bank: 'geral',
    niche: 'Festa e decoração',
    productType: 'Saia de babado TNT para mesa de festa',
    keywords: ['saia babado', 'saia de mesa', 'toalha de mesa festa'],
    archetype: 'Achado/Demonstração',
    audience: 'Feminino',
    charCount: 205,
    fits8s: false,
    text: 'Olha o tamanho disso! Pra mesa de festa grande cobre tudo num instante, escondendo qualquer bagunça com caimento perfeito. Muito fácil de instalar e super prática de guardar pra usar tudo depois do evento.',
  },

  // Nicho: Eletrônicos
  {
    id: 'ELE-01',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Câmera digital',
    keywords: ['camera digital', 'camera 4k', 'filmadora', 'camera de acao'],
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
    charCount: 197,
    fits8s: false,
    text: 'Ah, mas o rico gosta de ser feito de bobo mesmo, né? Paga caro na maçã sendo que aqui tem smartwatch completo, com garantia e parcelamento sem juros. Aproveita que tá rolando oferta até meia-noite.',
  },
  {
    id: 'ELE-03',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Celular',
    keywords: ['celular', 'smartphone', 'iphone', 'xiaomi', 'samsung', 'motorola'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 206,
    fits8s: false,
    text: 'Olha o preço disso aqui agora! Acabou de entrar em oferta relâmpago com super desconto exclusivo. Aproveita que só vai até meia-noite. O link tá aqui no carrinho laranja, corre e pega o seu antes que acabe!',
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
    keywords: ['monitor', 'monitor gamer', 'monitor curvo'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 192,
    fits8s: true,
    isStarred: true,
    notes: '⭐ Melhor copy de monitor (10 s, produto de ~R$ 600).',
    text: 'Agora é oficial, o TikTok endoidou. Esse monitor Valac Z18 Maze baixou mais da metade, com tela curva super imersiva e imagens muito nítidas, com a parcela menos que uma pizza. Clica no carrinho!',
  },
  {
    id: 'ELE-07',
    bank: 'geral',
    niche: 'Eletrônicos',
    productType: 'Monitor',
    keywords: ['monitor', 'monitor gamer', 'monitor curvo'],
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
    keywords: ['tablet', 'ipad'],
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
    keywords: ['triciclo eletrico', 'triciclo drift'],
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
    keywords: ['triciclo eletrico', 'triciclo drift'],
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
    keywords: ['carrinho de bebe', 'carrinho de passeio', 'bebe conforto'],
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
    keywords: ['esteira eletrica', 'esteira ergometrica', 'esteira dobravel'],
    archetype: 'Choque de preço/Urgência',
    audience: 'Unissex',
    charCount: 221,
    fits8s: false,
    text: 'Agora é oficial, o TikTok endoidou. Essa esteira elétrica dobrável caiu pra menos da metade. Silenciosa, com controle e painel LED. E ainda suporta até 100 quilos. A parcela é menos que uma pizza. Acaba hoje. Clica no carrinho agora.',
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
    keywords: ['bateria solar', 'estacao de energia'],
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
    keywords: ['bateria de litio', 'bateria lifepo4', 'bateria estacionaria'],
    archetype: 'Especificação',
    audience: 'Unissex',
    charCount: 199,
    fits8s: false,
    text: 'Consegui pegar a minha na loja. Essa bateria é incrível. Olha o visor LCD, super leve, conector pronto e célula de lítio com BMS integrado. Muito superior ao chumbo-ácido. Corre antes que acabe tudo.',
  },

  // Nicho: Ferramentas
  {
    id: 'FER-01',
    bank: 'geral',
    niche: 'Ferramentas',
    productType: 'Alicate hidráulico',
    keywords: ['alicate hidraulico', 'alicate de crimpar'],
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
    keywords: ['puncao eletrica', 'puncionadeira', 'puncao hidraulica'],
    archetype: 'Especificação',
    audience: 'Masculino',
    charCount: 218,
    fits8s: false,
    text: 'Gente, olha esse achado pra quem trabalha com metal! Punção elétrica com 200 W e 20 toneladas de força. Vem com 9 matrizes pra furos perfeitos, acabamento impecável e envio rápido. Clica no carrinho pra garantir a sua.',
  },

  // Nicho: Agro e roça
  {
    id: 'AGR-01',
    bank: 'geral',
    niche: 'Agro e roça',
    productType: 'Motocultivador',
    keywords: ['motocultivador', 'tratorito'],
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
    keywords: ['pedaleira', 'pedal guitarra', 'pedal de guitarra'],
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
    charCount: 216,
    fits8s: false,
    text: 'Paguei o preço de um e recebi dois pares, perfeitos para a academia. Flexibilidade surreal, super leve e o pé respira o treino inteiro. Kit com 2 quase de graça hoje. Clique aqui embaixo antes que acabe o seu número.',
  },
  {
    id: 'CAL-04',
    bank: 'calcados_masculinos',
    niche: 'Calçados masculinos',
    productType: 'Kit 2 pares de tênis masculino',
    keywords: ['kit 2 pares', 'dois pares', '2 pares', 'kit tenis'],
    archetype: 'Unboxing/Chegou',
    audience: 'Masculino',
    charCount: 215,
    fits8s: false,
    text: 'Cara, não acredito que chegou o meu kit com dois pares. Olha a maciez disso aqui: dobra no meio, não deforma e parece que você tá pisando nas nuvens. Leve demais pro dia a dia. Clica no carrinho e garante o seu kit.',
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
    charCount: 218,
    fits8s: false,
    text: 'Se liga nessa camiseta streetwear, a estampa é insana e a qualidade vai te surpreender. 100% algodão fio 30.1, super macia, caimento impecável e costura reforçada pra durar muito. O estoque tá voando, já garante a sua.',
  },
  {
    id: 'ROU-02',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Bermuda masculina',
    keywords: ['bermuda', 'short', 'shorts', 'bermuda treino', 'short academia'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 202,
    fits8s: false,
    text: 'Irmão, achei a bermuda que resolveu o problema do celular no treino. Olha esse bolso interno: você corre e o celular não balança nada. Zero assadura e conforto total. Clica aqui embaixo e garante a sua.',
  },
  {
    id: 'ROU-03',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Kit 2 bermudas / shorts 2 em 1',
    keywords: ['kit 2 bermudas', 'kit 2 shorts', 'short 2 em 1', 'kit bermuda', 'kit shorts'],
    archetype: 'Kit/Valor',
    audience: 'Masculino',
    charCount: 220,
    fits8s: false,
    text: 'Gente, olha esse kit com dois shorts 2 em 1 pra treinar. Tecido dry fit super leve, forro com bolso firme que segura o celular e total liberdade pra agachar pesado. Conforto máximo pro treino diário, com total liberdade.',
  },
  {
    id: 'ROU-04',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Kit 4 camisetas térmicas',
    keywords: ['camisa termica', 'camiseta termica', 'segunda pele', 'protecao uv', 'kit 4 camisas', 'kit camisetas'],
    archetype: 'Kit/Valor',
    audience: 'Masculino',
    charCount: 211,
    fits8s: false,
    text: 'E aí, mano, olha o que eu recebi. Kit com 4 camisas térmicas de altíssima qualidade. Veste como segunda pele, super flexível, fresca e com proteção solar pro dia todo. Leva 4 peças. Toca embaixo e garante o seu.',
  },
  {
    id: 'ROU-05',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Calça jogger de frio',
    keywords: ['calca jogger', 'calca moletom', 'calca masculina', 'jogger', 'moletom'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 217,
    fits8s: false,
    text: 'Esfriou, né? Achei aquela jogger perfeita pra treinar ou sair sem congelar. Forro felpudo super macio que esquenta de verdade, com cós elástico confortável que não prende os movimentos. Clica e garanta a sua pro frio.',
  },
  {
    id: 'ROU-06',
    bank: 'roupas_masculinas',
    niche: 'Roupas masculinas',
    productType: 'Calça jogger de frio',
    keywords: ['calca jogger', 'calca moletom', 'calca flanelada', 'jogger', 'calca de frio'],
    archetype: 'Dor→Solução',
    audience: 'Masculino',
    charCount: 204,
    fits8s: false,
    text: 'Cara, se você odeia passar frio, olha o que eu achei no TikTok. Toda flanelada por dentro, corte impecável que barra o vento e cós ajustável super confortável. O melhor achado tá aqui no carrinho laranja.',
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
    keywords: [
      'organizador',
      'prateleira',
      'cortina',
      'tapete',
      'cama',
      'mesa',
      'banho',
      'lencol',
      'travesseiro',
      'armario',
      'rack',
      'banheiro',
      'placa de casa',
      'cabide',
      'sapateira',
      'cesto',
      'varal',
      'organizador',
      'pastilha sanitaria',
    ],
    targetNiches: ['Casa, banheiro e organização', 'Casa e utilidades'],
  },
  {
    keywords: [
      'rede de descanso',
      'rede de dormir',
      'rede casal',
      'rede solteiro',
      'rede compacta',
      'rede',
      'acampamento',
      'camping',
      'varanda',
      'descanso',
      'cochilo',
      'lazer',
      'relaxar',
      'toalha',
      'edredom',
      'cobertor',
      'manta',
    ],
    targetNiches: ['Casa, lazer e descanso', 'Casa e utilidades'],
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
 * Limpa uma linha de título de anúncio de e-commerce e extrai o nome conciso do produto
 */
export function cleanTitleToShortName(firstLine: string): string {
  let cleaned = (firstLine || '')
    .replace(/^[-*#•\s]+/, '')
    .replace(/^(?:produto|nome|t[ií]tulo|item)\s*[:=-]\s*/i, '')
    // Remove especificações de memória/conectividade/redes comuns em títulos de e-commerce
    .replace(/\b\d+\s*(?:gb|tb|ram|rom|mah|hz|fps|mp|k)\b/gi, '')
    .replace(/\b(?:5g|4g|3g|wifi|bluetooth|bivolt|original|lancamento|promocao)\b/gi, '')
    // Remove medidas técnicas e especificações comuns (ex: 2.40x1.40 metros, 100% algodão, 2000w, etc.)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:x|por)\s*\d+(?:[.,]\d+)?\s*(?:metros?|m|cm|mm)?\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:metros?|m|cm|mm|kg|g|litros?|l|ml|watts?|w|volts?|v|polegadas?|pol)\b/gi, '')
    .replace(/\b(?:em|com|de)?\s*\d+%\s*[a-zà-ú]+\b/gi, '')
    .replace(/\b(?:solteiro\s+e\s+casal|solteiro|casal|premium|novo)\b/gi, '')
    .replace(/[,;:.!?\-–—]+.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Se começar com prefixos redundantes antes da marca/modelo real (ex: "Celular Xiaomi Poco X8 Pro" -> "Poco X8 Pro")
  if (/^(?:celular|smartphone|aparelho)\s+(?:xiaomi\s+)?(poco\s+[a-z0-9\s]+)/i.test(cleaned)) {
    const match = cleaned.match(/^(?:celular|smartphone|aparelho)\s+(?:xiaomi\s+)?(poco\s+[a-z0-9\s]+)/i);
    if (match?.[1]) cleaned = match[1].trim();
  } else if (/^(?:celular|smartphone)\s+/i.test(cleaned) && cleaned.split(/\s+/).length > 3) {
    cleaned = cleaned.replace(/^(?:celular|smartphone)\s+/i, '');
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    // Permite até 4 palavras (ou 5 se curtas) para não cortar marcas e modelos como "Poco X8 Pro" ou "Monitor Gamer Gawfolk"
    const maxWords = words.length <= 4 ? words.length : (words.slice(0, 4).join(' ').length <= 26 ? 4 : 3);
    const candidate = words.slice(0, maxWords).join(' ');
    return candidate.charAt(0).toUpperCase() + candidate.slice(1);
  }
  return cleaned;
}

/**
 * Verifica se o usuário informou diretamente que há frete grátis no produto
 */
export function hasExplicitFreeShipping(info: string): boolean {
  const norm = normalizeAccents(info || '');
  return /\b(?:frete\s*gratis|frete\s*gratuito|frete\s*0|frete\s*zero|sem\s*custo\s*de\s*envio|envio\s*gratis|envio\s*gratuito)\b/i.test(norm);
}

/**
 * Remove qualquer menção a 'frete grátis' da fala, a menos que tenha sido informado diretamente
 */
export function sanitizeFreeShippingMentions(text: string, hasFreeShipping: boolean): string {
  if (hasFreeShipping) return text;
  return text
    .replace(/\bcom\s+frete\s+gr[aá]tis\b/gi, 'com super desconto')
    .replace(/\bcom\s+frete\s+gratuito\b/gi, 'com super desconto')
    .replace(/\bo\s+frete\s+gr[aá]tis\b/gi, 'esse super desconto')
    .replace(/\bo\s+frete\s+gratuito\b/gi, 'esse super desconto')
    .replace(/\bde\s+frete\s+gr[aá]tis\b/gi, 'com super desconto')
    .replace(/\bde\s+frete\s+gratuito\b/gi, 'com super desconto')
    .replace(/\be\s+tem\s+frete\s+gr[aá]tis\b/gi, 'e tá valendo muito a pena')
    .replace(/\be\s+tem\s+frete\s+gratuito\b/gi, 'e tá valendo muito a pena')
    .replace(/\bfrete\s+gr[aá]tis\b/gi, 'super desconto')
    .replace(/\bfrete\s+gratuito\b/gi, 'super desconto');
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
  const kitMatch =
    norm.match(/\b(?:kit\s*(?:com\s*)?|combo\s*(?:com\s*)?|leve\s*|vem\s*|pacote\s*(?:com\s*)?)(\d+)\b/i) ||
    norm.match(/\b(\d+)\s*(?:unidades?|pecas?|itens|pares|camisetas?|camisas?|regatas?|bermudas?|shorts?|ventiladores?|alto-falantes?|cuecas?)\b/i);
  let kitQty = kitMatch ? parseInt(kitMatch[1], 10) : undefined;
  if (!kitQty) {
    if (/\b(?:kit\s*(?:com\s*)?)?(?:dois|duas)\b|\b2\s*(?:pares|unidades|pecas|itens)?\b/i.test(norm) && /\b(?:kit|combo|par|pares|dupla)\b/i.test(norm)) {
      kitQty = 2;
    } else if (/\b(?:kit\s*(?:com\s*)?)?tres\b|\b3\s*(?:unidades|pecas|itens)?\b/i.test(norm) && /\b(?:kit|combo|trio)\b/i.test(norm)) {
      kitQty = 3;
    } else if (/\b(?:kit\s*(?:com\s*)?)?quatro\b|\b4\s*(?:unidades|pecas|itens)?\b/i.test(norm) && /\b(?:kit|combo|quarteto)\b/i.test(norm)) {
      kitQty = 4;
    }
  }

  const colorCandidates = ['preto', 'preta', 'branco', 'branca', 'vermelho', 'vermelha', 'azul', 'rosa', 'verde', 'cinza', 'amarelo', 'bege', 'marrom', 'dourado', 'prata', 'roxo', 'laranja'];
  const colors = colorCandidates.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(norm));

  const materialCandidates = ['carbono', 'inox', 'aco inox', 'aco', 'ceramica', 'silicone', 'vidro', 'algodao', 'dry fit', 'flanelado', 'felpudo', 'couro', 'eva', 'gel', 'litio', 'tnt', 'vinil', 'metal'];
  const foundMaterial = materialCandidates.find((m) => norm.includes(m));

  // 2. Detectar se é Calçado Masculino ou Roupa Masculina vs Produto Geral
  const footwearTerms = [
    'tenis',
    'sapato',
    'sapatenis',
    'bota',
    'coturno',
    'chuteira',
    'chinelo',
    'sandalia',
    'papete',
    'mocassim',
    'calcado',
    'calcados',
    'sneaker',
    'sneakers',
    'sapatilha',
    'rasteirinha',
    'peep toe',
    'oxford',
    'mule',
    'loafer',
  ];
  const maleApparelTerms = ['camiseta', 'camisa', 'bermuda', 'short', 'shorts', 'calca jogger', 'jogger', 'moletom', 'jaqueta', 'cueca', 'sunga', 'camisa termica', 'camiseta termica', 'regata', 'polo', 'calca jeans', 'calca sarja', 'agasalho'];
  const femaleOnlyApparelTerms = ['saia', 'cropped', 'baby doll', 'babydoll', 'camisola', 'sutia', 'calcinha', 'lingerie', 'biquini', 'maio', 'rasteirinha', 'scarpin', 'salto alto'];
  const isVestidoGarment = /(?<!\bbem\s+|\bmal\s+)\bvestido(?:s)?\b/i.test(norm) && !norm.includes('bem vestido') && !norm.includes('mal vestido');

  const isFootwear = footwearTerms.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(norm)) && !norm.includes('palmilha');
  const isApparel = maleApparelTerms.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(norm)) && !norm.includes('saia babado') && !norm.includes('mesa');
  const isFemaleExplicit =
    /\b(feminino|feminina|mulher|mulheres|para ela|dama)\b/i.test(norm) ||
    femaleOnlyApparelTerms.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(norm)) ||
    isVestidoGarment;
  const isMaleExplicit = /\b(masculino|masculina|homem|homens|para ele)\b/i.test(norm);

  let subMode: Produtos2SubMode = 'produtos_geral';
  let maleSubOption: Produtos2MaleSubOption = 'calcados';

  // REGRA MESTRA (Item 1): Qualquer menção a calçado/tênis/sapato entra no modo calçado automaticamente!
  if (isFootwear) {
    subMode = 'vestuario_masculino';
    maleSubOption = 'calcados';
  } else if (isApparel && !isFemaleExplicit) {
    subMode = 'vestuario_masculino';
    maleSubOption = 'roupas';
  }

  // 3. Extrair Nome Curto e Falável
  // REGRA MESTRA: O título do anúncio (primeiras 1 a 3 linhas) SEMPRE tem prioridade máxima absoluta
  // sobre palavras avulsas que aparecem no meio ou fim da descrição (como acessórios ou casos de uso).
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const sectionHeaderRegex = /^(?:especifica[cç][oõ]es|benef[ií]cios|instru[cç][oõ]es|cuidados|caracter[ií]sticas|descri[cç][aã]o|sobre|itens\s+inclusos|dados\s+t[eé]cnicos|como\s+usar|medidas|tamanhos?)\b/i;

  const titleLines: string[] = [];
  for (let i = 0; i < Math.min(rawLines.length, 3); i++) {
    if (sectionHeaderRegex.test(rawLines[i])) break;
    titleLines.push(rawLines[i]);
  }
  const titleText = titleLines.join(' ');
  const titleNorm = normalizeAccents(titleText);

  // Sanitiza menções circunstanciais / periféricas no corpo do texto (ex: "com seu smartphone", "usando seu smartphone", "cabe na mochila")
  const bodyNormCleaned = norm
    .replace(/\b(?:com|usando|usar|utilizando|no|na|para|pro|pra|cabe\s+no|cabe\s+na|compat[ií]vel\s+com|conecta\s+no|carrega\s+o|carregue\s+seu)\s+(?:o|a|os|as|seu|sua|seus|suas)?\s*(?:smartphone|celular|telefone|aparelho|computador|notebook|mochila|bolso|carro|moto|ve[ií]culo)\b/gi, ' ')
    .replace(/\b(?:descansar|dormir|relaxar|deitar|assistir|jogar)\s+(?:com|usando|no)\s+(?:seu\s+)?(?:smartphone|celular)\b/gi, ' ');

  let shortName = '';
  const specificShortNames: [RegExp, string][] = [
    [/\bbanco\s+(?:de\s+)?(?:exercicios?|musculacao|supino|treino)/i, 'Banco de Exercícios'],
    [/\bbanco\s+(?:ajustavel|reclinavel|dobravel)/i, 'Banco Ajustável'],
    [/\bestacao\s+de\s+musculacao/i, 'Estação de Musculação'],
    [/\brede\s+(?:de\s+)?descanso|\brede\s+(?:de\s+)?dormir|\brede\s+(?:casal|solteiro)|\brede\s+compacta\b/i, 'Rede de Descanso'],
    [/\brede\b/i, 'Rede de Descanso'],
    [/\bcadeira\s+(?:de\s+)?(?:escritorio|gamer|presidente|ergonomica)/i, 'Cadeira de Escritório'],
    [/\bmochila\s+(?:impermeavel|notebook|escolar|viagem)?/i, 'Mochila Impermeável'],
    [/\bbarraca\s+(?:de\s+)?(?:camping|acampamento)/i, 'Barraca de Camping'],
    [/\bcolchao\s+(?:inflavel|casal|solteiro)/i, 'Colchão Inflável'],
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
    [/\bpanela\s+de\s+pressao/i, 'Panela de Pressão'],
    [/\bjogo\s+de\s+panelas/i, 'Jogo de Panelas'],
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
    [/\btravesseiro\s+(?:ortopedico|cervical|viscoelastico)?/i, 'Travesseiro Ortopédico'],
    [/\bcortina\s+(?:blackout|corta\s*luz)?/i, 'Cortina Blackout'],
    [/\btapete\s+(?:antiderrapante|sala|quarto)?/i, 'Tapete Antiderrapante'],
    [/\bluminaria\s+(?:solar|led|mesa)?/i, 'Luminária Solar'],
    [/\bfita\s+led/i, 'Fita LED'],
    [/\bumidificador\s+(?:de\s+ar)?/i, 'Umidificador de Ar'],
    [/\baspirador\s+(?:de\s+po|robo)?/i, 'Aspirador de Pó'],
    [/\bpalmilha\s+(?:de\s+)?gel|\bpalmilha\s+ortopedica/i, 'Palmilha de Gel'],
    [/\bluva\s+descartavel|\bviniflex/i, 'Luva Descartável'],
    [/\bsaia\s+(?:de\s+)?babado|\btoalha\s+decorativa/i, 'Saia de Mesa TNT'],
    [/\bcamera\s+digital|\bcamera\s+4k/i, 'Câmera Digital 4K'],
    [/\bsmartwatch|\bapple\s+watch|\brelogio\s+inteligente/i, 'Smartwatch'],
    [/\bcelular|\bsmartphone/i, 'Smartphone'],
    [/\bmonitor/i, 'Monitor'],
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

  // Prioridade 1: Extrai o nome real e específico do produto diretamente da 1ª linha / título do anúncio
  // preservando a marca e modelo exatos fornecidos pelo usuário (ex: "Poco X8 Pro", "Monitor Gamer Gawfolk", "Rede de Descanso")
  if (titleLines.length > 0) {
    const extractedFromTitle = cleanTitleToShortName(titleLines[0]);
    if (extractedFromTitle && extractedFromTitle.length >= 3 && !/^(?:produto|item|anuncio|descricao)$/i.test(extractedFromTitle)) {
      shortName = extractedFromTitle;
    }
  }

  // Prioridade 2: Se não casou no título com termos reais, verifica se o título do anúncio casa com algum produto conhecido
  if (!shortName && titleNorm) {
    for (const [regex, label] of specificShortNames) {
      if (regex.test(titleNorm)) {
        shortName = label;
        break;
      }
    }
  }

  // Prioridade 3: Se ainda não tiver shortName, checa o corpo sanitizado (sem menções periféricas a celulares/notebooks)
  if (!shortName) {
    for (const [regex, label] of specificShortNames) {
      if (regex.test(bodyNormCleaned)) {
        shortName = label;
        break;
      }
    }
  }

  // Prioridade 4: Fallback
  if (!shortName && text) {
    const firstLine = rawLines[0] || '';
    const cleaned = cleanTitleToShortName(firstLine);
    if (cleaned && cleaned.length >= 2) {
      shortName = cleaned;
    }
  }

  // Se tiver potência em Watts para ferramentas/roçadeiras/som e não estiver no nome curto, anexa de forma concisa
  if (wattsMatch && shortName && /rocadeira|furadeira|parafusadeira|cortador|liquidificador|secador|puncao/i.test(norm)) {
    const cleanW = wattsMatch[1].replace(/\s+/g, '').toUpperCase();
    if (!shortName.toLowerCase().includes('w')) {
      shortName = `${shortName} ${cleanW}`;
    }
  }

  // 4. Detectar Nicho (Prioridade 1: Título e ShortName; Prioridade 2: Regras de nicho vizinho; Prioridade 3: Banco geral)
  let niche = 'Produtos Gerais';
  if (subMode === 'vestuario_masculino') {
    niche = maleSubOption === 'calcados' ? 'Calçados masculinos' : 'Roupas masculinas';
  } else {
    const shortNameNorm = normalizeAccents(shortName || '');
    const titleAndShortNorm = `${shortNameNorm} ${titleNorm}`.trim();

    // Prioridade 1: Checa no título e no shortName identificado
    for (const rule of NEIGHBOR_NICHE_RULES) {
      if (rule.keywords.some((kw) => titleAndShortNorm.includes(normalizeAccents(kw)))) {
        niche = rule.targetNiches[0];
        break;
      }
    }
    if (niche === 'Produtos Gerais') {
      for (const entry of COPIES_PRODUTOS_GERAIS) {
        if (entry.keywords.some((kw) => titleAndShortNorm.includes(normalizeAccents(kw)))) {
          niche = entry.niche;
          break;
        }
      }
    }

    // Prioridade 2: Se ainda for Produtos Gerais, checa no corpo sanitizado
    if (niche === 'Produtos Gerais') {
      for (const rule of NEIGHBOR_NICHE_RULES) {
        if (rule.keywords.some((kw) => bodyNormCleaned.includes(normalizeAccents(kw)))) {
          niche = rule.targetNiches[0];
          break;
        }
      }
    }
    if (niche === 'Produtos Gerais') {
      for (const entry of COPIES_PRODUTOS_GERAIS) {
        if (entry.keywords.some((kw) => bodyNormCleaned.includes(normalizeAccents(kw)))) {
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
  const isUnissexNiches =
    niche === 'Casa, banheiro e organização' ||
    niche === 'Casa e utilidades' ||
    niche === 'Jardim' ||
    niche === 'Infantil e brinquedos' ||
    niche === 'Eletrônicos' ||
    niche === 'Climatização' ||
    niche === 'Energia' ||
    niche === 'Natação / Esporte aquático' ||
    niche === 'Pet' ||
    niche === 'Conforto para os pés' ||
    niche === 'Música' ||
    /rede|descanso|acampamento|camping|travesseiro|colchao/i.test(normalizeAccents(shortName || ''));

  if (isUnissexNiches && !isMaleExplicit && !isFemaleExplicit) {
    influencer = null;
    clientGender = 'Unissex';
  } else if (subMode === 'vestuario_masculino' || isMaleExplicit || clearlyMaleNiches.includes(niche) || /\b(banco de exercicio|banco ajustavel|supino|musculacao|apoio scott)\b/i.test(norm)) {
    influencer = 'Homem';
    clientGender = 'Masculino';
  } else if (isFemaleExplicit || clearlyFemaleNiches.includes(niche) || /banheiro|toalha|cosmetico|esteira ergometrica/i.test(norm)) {
    influencer = 'Mulher';
    clientGender = 'Feminino';
  } else {
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
    isFootwear,
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
 * Encurta copy longa caso ultrapasse o limite de caracteres:
 * - Para vídeos de 8s: no máximo 165 caracteres com espaço
 * - Para vídeos de 10s: no máximo 235 caracteres com espaço
 * MEXENDO O MÍNIMO POSSÍVEL:
 * - Evita mexer no início ("hook" dos primeiros 3 segundos que possui o "Nossa!" e as palavras seguintes)
 * - Evita mexer no final (o "CTA", chamada para ação que é parte vital da conversão)
 * - Mexe exclusivamente no MEIO (o "corpo" da fala), enxugando orações ou frases secundárias
 */
export function enforceMaxChars(copyText: string, maxChars: number, minTargetChars = 120): string {
  const clean = copyText.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [clean];
  if (sentences.length <= 1) {
    // Frase única: preserva os primeiros 3 segundos ("Nossa!" + palavras do início)
    const words = clean.split(' ');
    const hookWords = words.slice(0, 5).join(' ');
    const rest = words.slice(5).join(' ');
    const available = maxChars - hookWords.length - 1;
    if (available > 15) {
      return `${hookWords} ${rest.slice(0, available).replace(/[,;:\s]+$/, '')}!`;
    }
    return clean.slice(0, maxChars - 1).replace(/[,;:\s]+$/, '') + '!';
  }

  const hook = sentences[0]; // Início intacto (Hook com "Nossa!")
  const cta = sentences[sentences.length - 1]; // Final intacto (CTA)
  const middle = sentences.slice(1, -1);

  if (middle.length > 0) {
    // Prioriza manter as frases do meio mais ricas em benefício ("olha", números)
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

    if (candidate.length <= maxChars && candidate.length >= minTargetChars) {
      return candidate;
    }

    if (candidate.length <= maxChars && orderedMiddle.length > 0) {
      return candidate;
    }

    // Se ficou curto ou sobrou espaço para uma oração parcial de uma frase descartada do meio:
    const remainingMiddle = middle.find((m) => !keptMiddle.includes(m));
    if (remainingMiddle) {
      const clauses = remainingMiddle.split(/[,;–—]+/).map((c) => c.trim()).filter(Boolean);
      for (let k = clauses.length - 1; k >= 1; k--) {
        const partialMid = clauses.slice(0, k).join(', ') + '.';
        const testCand = [hook, ...orderedMiddle, partialMid, cta].join(' ').replace(/\s+/g, ' ').trim();
        if (testCand.length <= maxChars) {
          return testCand;
        }
      }
    }

    if (candidate.length <= maxChars) {
      return candidate;
    }
  }

  // Se mesmo sem nenhuma frase do meio a soma de hook + cta couber no limite:
  const baseHookCta = `${hook} ${cta}`.replace(/\s+/g, ' ').trim();
  if (baseHookCta.length <= maxChars) {
    return baseHookCta;
  }

  // Se até hook + cta exceder: preserva 100% o hook ("Nossa!" + primeiras palavras) e enxuga a cauda do CTA
  const allowedCtaLen = maxChars - hook.length - 1;
  if (allowedCtaLen > 15) {
    const trimmedCta = cta.slice(0, allowedCtaLen).replace(/[,;:\s]+$/, '') + '!';
    return `${hook} ${trimmedCta}`;
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
      .replace(/^(Nossa[!,\s]*\s*)?Meu amigo\s*,/i, '$1Amiga,')
      .replace(/^(Nossa[!,\s]*\s*)?Cara\s*,/i, '$1Amiga,')
      .replace(/^(Nossa[!,\s]*\s*)?Irmão\s*,/i, '$1Amiga,')
      .replace(/^(Nossa[!,\s]*\s*)?E aí,\s*mano\s*,/i, '$1Amiga,');
  } else if (clientGender === 'Masculino') {
    out = out
      .replace(/^(Nossa[!,\s]*\s*)?Amiga\s*,/i, '$1Meu amigo,')
      .replace(/\bTá cansada\b/g, 'Tá cansado')
      .replace(/\btá cansada\b/g, 'tá cansado')
      .replace(/\bcansada de\b/gi, 'cansado de');
  } else if (clientGender === 'Unissex') {
    out = out
      .replace(/^(Nossa[!,\s]*\s*)?Meu amigo\s*,/i, '$1Gente,')
      .replace(/^(Nossa[!,\s]*\s*)?Cara\s*,/i, '$1Gente,')
      .replace(/^(Nossa[!,\s]*\s*)?Irmão\s*,/i, '$1Gente,')
      .replace(/^(Nossa[!,\s]*\s*)?Amiga\s*,/i, '$1Gente,');
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
 * Adiciona a expressão neutra "Nossa! " no início de todas as copies/falas
 * para servir de margem de corte do 1º segundo no Veo (onde o Veo exibe o frame do storyboard),
 * padronizando sempre para "Nossa! [Texto com inicial maiúscula]".
 */
export function ensureLeadingNossaPrefix(text: string): string {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  // Se já começa com "Nossa!" ou "Nossa,", padroniza com "Nossa! " e capitaliza a palavra seguinte
  if (/^nossa[!,\s]\s*/i.test(trimmed)) {
    const after = trimmed.replace(/^nossa[!,\s]\s*/i, '').trim();
    if (!after) return 'Nossa!';
    const capitalizedAfter = after.charAt(0).toUpperCase() + after.slice(1);
    return `Nossa! ${capitalizedAfter}`;
  }

  // Adiciona "Nossa! " no início mantendo a primeira letra em maiúscula
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `Nossa! ${capitalized}`;
}

/**
 * Remove o prefixo "Nossa! " ou "Nossa, " do início de uma copy,
 * garantindo que a frase comece direto com a primeira letra maiúscula (modo "Não Usar Intro").
 */
export function stripLeadingNossaPrefix(text: string): string {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  if (/^nossa[!,\s]\s*/i.test(trimmed)) {
    const after = trimmed.replace(/^nossa[!,\s]\s*/i, '').trim();
    if (!after) return '';
    return after.charAt(0).toUpperCase() + after.slice(1);
  }
  return trimmed;
}

/**
 * Aplica ou remove a Intro ("Nossa! ") conforme a escolha do usuário no painel:
 * - useIntro === true: garante prefixo "Nossa! "
 * - useIntro === false: remove qualquer "Nossa! " inicial
 */
export function applySpeechIntro(text: string, useIntro: boolean = false): string {
  if (useIntro) {
    return ensureLeadingNossaPrefix(text);
  }
  return stripLeadingNossaPrefix(text);
}

/**
 * Verifica se o nome do produto é feminino em português para concordância ("esse"/"essa", "o seu"/"a sua")
 */
function isFeminineProductName(name: string): boolean {
  const norm = normalizeAccents(name.trim());
  return /^(rede|tinta|esteira|bicicleta|bike|e-bike|scooter|moto|garrafa|garrafinha|panificadora|air\s*fryer|fritadeira|panela|sanduicheira|torradeira|batedeira|chaleira|cafeteira|rocadeira|motosserra|mangueira|semente|escova|chapinha|prancha|palmilha|luva|saia|toalha|cortina|prateleira|sapateira|camera|webcam|tv|televisao|bateria|parafusadeira|furadeira|esmerilhadeira|lixadeira|serra|puncao|puncionadeira|trena|pedaleira|guitarra|camisa|camiseta|bermuda|calca|jaqueta|bota|sandalia|papete|chuteira|rasteirinha|cadeirinha|boneca|pelucia|capa|placa|pastilha|vara|linha|carretilha|isca|central|mesa|cama|cadeira|poltrona|estacao|barra|corda|anilha|fita|luminaria|lampada)\b/i.test(
    norm
  );
}

/**
 * Monta um resumo curto e natural das características reais informadas em "Informações do Produto",
 * usado APENAS quando é preciso substituir uma frase exclusiva do produto antigo (ex: "Silenciosa, com controle e painel LED" da esteira)
 * pelas características reais do produto novo (ex: "Com apoio Scott, extensor de pernas e espuma de 5 cm. E base de aço firme.").
 */
function buildMinimalReplacementClauses(
  productName: string,
  productInfo: string,
  specs: ProductSpecsExtracted,
  isFem: boolean
): {
  conciseFeatureSentence: string;
  shortWithClause: string;
} {
  const norm = normalizeAccents(`${productName} ${productInfo}`);

  // Caso Rede de Descanso / Camping / Ar livre
  if (/\b(rede|descanso|acampamento|camping|varanda)\b/i.test(norm)) {
    const isAlgodao = /algodao/i.test(norm);
    const hasFranja = /franja/i.test(norm);
    const shortClause = isAlgodao
      ? hasFranja
        ? 'feita em 100% algodão com franjas reforçadas'
        : 'feita em 100% algodão super confortável'
      : 'super confortável e resistente';
    return {
      conciseFeatureSentence: 'Costuras reforçadas, super macia, fácil de instalar e aguenta o tranco com total segurança.',
      shortWithClause: shortClause,
    };
  }

  // Caso Banco de Exercícios / Musculação
  if (/\b(banco|supino|apoio scott|extensor)\b/i.test(norm)) {
    const parts: string[] = [];
    if (/scott/i.test(norm)) parts.push('apoio Scott');
    if (/extensor/i.test(norm)) parts.push('extensor de pernas');
    if (/espuma/i.test(norm)) parts.push('espuma macia');
    const firstPart = parts.length > 0 ? `Com ${parts.join(', ')}.` : 'Com regulagem completa de inclinação.';
    const secondPart = /aco|triangular|antiderrapante/i.test(norm)
      ? 'E ainda tem base de aço super firme e antiderrapante.'
      : 'Super resistente e firme pro treino.';
    return {
      conciseFeatureSentence: `${firstPart} ${secondPart}`,
      shortWithClause: parts.length > 0 ? `com ${parts.join(', ')} e base de aço firme` : 'com estrutura reforçada e ajustável',
    };
  }

  // Caso Tinta / Parede / Reforma
  if (/\b(tinta\s+(?:de\s+)?parede|tinta\s+acrilica|tinta\s+emborrachada|pintura\s+(?:de\s+)?parede)\b/i.test(norm) && !norm.includes('nao solta tinta')) {
    return {
      conciseFeatureSentence: /lavavel|sem cheiro/i.test(norm)
        ? 'Cobre já na primeira mão, sem cheiro forte e super lavável. Rende demais.'
        : 'Cobre tudo já na primeira mão, seca rápido e rende demais.',
      shortWithClause: 'com cobertura perfeita já na primeira mão e ótimo rendimento',
    };
  }

  // Extrair 1 ou 2 pontos curtos reais das informações do produto
  const cleanFacts = specs.keyFacts
    .map((f) => f.replace(/^[•*-]\s*/, '').replace(/[.!?]+$/, '').trim())
    .filter((f) => f.length >= 5 && f.length <= 65 && normalizeAccents(f) !== normalizeAccents(productName));

  if (cleanFacts.length >= 2) {
    const f1 = cleanFacts[0].charAt(0).toUpperCase() + cleanFacts[0].slice(1);
    const f2 = cleanFacts[1].charAt(0).toLowerCase() + cleanFacts[1].slice(1);
    return {
      conciseFeatureSentence: `${f1}. E ainda conta com ${f2}.`,
      shortWithClause: `com ${cleanFacts[0].toLowerCase()} e ${f2}`,
    };
  }

  if (cleanFacts.length === 1) {
    const f1 = cleanFacts[0].charAt(0).toUpperCase() + cleanFacts[0].slice(1);
    return {
      conciseFeatureSentence: `${f1}, super resistente e prático pro dia a dia.`,
      shortWithClause: `com ${cleanFacts[0].toLowerCase()} e qualidade absurda`,
    };
  }

  if (specs.watts) {
    return {
      conciseFeatureSentence: `Tem ${specs.watts} de potência real e acabamento super resistente.`,
      shortWithClause: `com ${specs.watts} de potência e alta durabilidade`,
    };
  }

  return {
    conciseFeatureSentence: `${isFem ? 'Super prática, resistente' : 'Super prático, resistente'} e com acabamento de alta qualidade.`,
    shortWithClause: 'com acabamento reforçado e qualidade surpreendente',
  };
}

/**
 * Avalia se a copy mantém a estrutura básica válida (prefixo "Nossa, ", sem "menina", e dentro do limite de 8s se aplicável)
 */
export function evaluateCopyDnaChecklist(copy: string, duration: Produtos2Duration): {
  passed: boolean;
  hasOlha: boolean;
  hasCompleteCta: boolean;
  isWithinWindow: boolean;
  score: number;
} {
  const clean = copy.replace(/\s+/g, ' ').trim();
  const hasOlha = /\bolha\b|\bolhem\b|\bveja\b/i.test(clean);
  const hasCompleteCta = /\b(carrinho|aqui embaixo|link|garante|aproveita|estoque|oferta|promoção|desconto|parcela|confira|confere|compre|adquira|pra você)\b/i.test(
    clean.slice(-95)
  );
  const maxAllowed = duration === 8 ? 165 : 235;
  const isWithinWindow = clean.length >= 80 && clean.length <= maxAllowed;

  let score = 100;
  if (!hasOlha) score -= 15;
  if (!hasCompleteCta) score -= 25;
  if (!isWithinWindow) score -= 50;

  return {
    passed: isWithinWindow && hasCompleteCta,
    hasOlha,
    hasCompleteCta,
    isWithinWindow,
    score,
  };
}

/**
 * Garante o prefixo "Nossa, ", concordância de gênero/vocativo e o respeito ao limite de caracteres (<= 165 em 8s, <= 235 em 10s)
 * sem alterar o texto original validado do banco além do estritamente necessário.
 */
export function calibrateCopyToTargetWindow(params: {
  copy: string;
  duration: Produtos2Duration;
  isSameProductBankCopy: boolean;
  clientGender: Produtos2ClientGender;
  influencer: 'Homem' | 'Mulher';
  useSpeechIntro?: boolean;
}): string {
  const { duration, clientGender, influencer, useSpeechIntro = false } = params;
  let text = applySpeechIntro(
    applyGenderAndVocativeRules(params.copy.replace(/\s+/g, ' ').trim(), clientGender, influencer),
    useSpeechIntro
  );

  const maxAllowed = duration === 8 ? 165 : 235;
  const minTarget = duration === 8 ? 110 : 160;

  if (text.length > maxAllowed) {
    text = applySpeechIntro(enforceMaxChars(text, maxAllowed, minTarget), useSpeechIntro);
  }

  return text;
}

/**
 * Escolhe SEMPRE uma das ~62 copies reais validadas que estão na memória do aplicativo:
 * - Prioridade 1: Copy do MESMO PRODUTO no banco.
 * - Prioridade 2: Copy de OUTRO PRODUTO DO MESMO NICHO (ou nicho vizinho) no banco, adaptando o mínimo possível.
 * - Prioridade 3: Quando não houver nem do mesmo nicho (ex.: produto totalmente aleatório como tinta de parede),
 *   escolhe no banco de ~62 copies a copy real que melhor combina com o perfil do produto e adapta o mínimo possível.
 * NUNCA tenta criar copy do zero.
 */
// Histórico recente para evitar sorteios repetidos da mesma copy consecutivamente (Item 11)
const recentPickedCopyIds: string[] = [];

export function selectAndAdaptProdutos2Copy(params: {
  subMode: Produtos2SubMode;
  maleSubOption: Produtos2MaleSubOption;
  productName: string;
  productInfo: string;
  duration: Produtos2Duration;
  customCopy?: string;
  clientGender: Produtos2ClientGender;
  influencer: Produtos2Influencer;
  useSpeechIntro?: boolean;
  excludeCopyId?: string;
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
    useSpeechIntro = false,
    excludeCopyId,
  } = params;

  const specs = analyzeProductInfoForProdutos2(`${productName} ${productInfo}`);
  const cleanName = (productName || specs.shortName || 'produto').trim();
  const normCombined = normalizeAccents(`${cleanName} ${productInfo}`);

  // Se o usuário preencheu copy personalizada (Seção 5.4)
  if (customCopy && customCopy.trim().length > 0) {
    const resolvedInf: 'Homem' | 'Mulher' =
      influencer || specs.influencer || (clientGender === 'Masculino' ? 'Homem' : 'Mulher');
    let finalCustom = applySpeechIntro(customCopy.trim(), Boolean(useSpeechIntro));
    if (duration === 8 && finalCustom.length > 165) {
      finalCustom = applySpeechIntro(enforceMaxChars(finalCustom, 165, 110), Boolean(useSpeechIntro));
    } else if (duration === 10 && finalCustom.length > 235) {
      finalCustom = applySpeechIntro(enforceMaxChars(finalCustom, 235, 160), Boolean(useSpeechIntro));
    }
    const customFreeShipping = hasExplicitFreeShipping(`${productName} ${productInfo} ${customCopy}`);
    finalCustom = sanitizeFreeShippingMentions(finalCustom, customFreeShipping);
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

  const rawInfoLines = (productInfo || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const titleNorm = normalizeAccents(rawInfoLines.slice(0, 3).join(' '));
  const titleAndNameNorm = `${normalizeAccents(cleanName)} ${titleNorm}`.trim();

  // Prioridade 1: Mesmo produto no banco ativo
  // Compara o nome e o título do produto contra o tipo ou palavras-chave das copies (evitando falsos positivos do corpo)
  let candidates = activeBank.filter((entry) => {
    const entryTypeNorm = normalizeAccents(entry.productType);
    const nameNorm = normalizeAccents(cleanName);
    if (nameNorm && (entryTypeNorm.includes(nameNorm) || nameNorm.includes(entryTypeNorm))) {
      return true;
    }
    return entry.keywords.some((kw) => {
      const kwNorm = normalizeAccents(kw);
      return kwNorm.length > 3 && new RegExp(`\\b${kwNorm}\\b`, 'i').test(titleAndNameNorm);
    });
  });

  let matchPriority: 'mesmo_produto' | 'mesmo_nicho' | 'nicho_vizinho' | 'outra_copy_do_banco' = 'mesmo_produto';

  if (specs.kitQuantity && specs.kitQuantity >= 2) {
    const kitCandidates = candidates.filter((c) => c.archetype === 'Kit/Valor' || /kit|dois|2|4/i.test(c.productType));
    if (kitCandidates.length > 0) {
      candidates = kitCandidates;
    } else {
      // Se não encontrou kit do mesmo produto, pega as falas validadas de kit da memória do app (CLI-03, CLI-04, CLI-05)
      const memoryKits = COPIES_PRODUTOS_GERAIS.filter((e) => ['CLI-03', 'CLI-04', 'CLI-05'].includes(e.id));
      if (memoryKits.length > 0) {
        candidates = memoryKits;
        matchPriority = 'mesmo_nicho';
      }
    }
  } else if (candidates.length > 1) {
    const singleCandidates = candidates.filter((c) => c.archetype !== 'Kit/Valor');
    if (singleCandidates.length > 0) {
      candidates = singleCandidates;
    }
  }

  // Prioridade 2: Outro produto do MESMO NICHO no banco ativo (ex: Banco de exercícios -> Fitness -> FIT-01 / FIT-02)
  if (candidates.length === 0) {
    candidates = activeBank.filter((entry) => entry.niche === specs.niche);
    if (candidates.length > 0) {
      matchPriority = 'mesmo_nicho';
    }
  }

  // Prioridade 2B: Nicho vizinho (Tabela 4.3)
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

  // Prioridade 3: Caso não tenha nem do mesmo produto nem do mesmo nicho (ex.: tinta de parede ou produto aleatório),
  // escolhe no banco de ~62 copies reais as copies que mais combinam com o perfil desse produto!
  if (candidates.length === 0) {
    matchPriority = 'outra_copy_do_banco';
    if (specs.kitQuantity && specs.kitQuantity >= 2) {
      candidates = COPIES_PRODUTOS_GERAIS.filter((e) => ['CLI-03', 'CLI-04', 'CLI-05'].includes(e.id));
    } else if (specs.isKidsProduct) {
      candidates = COPIES_PRODUTOS_GERAIS.filter((e) => ['INF-01', 'INF-02', 'INF-03', 'INF-05', 'INF-06'].includes(e.id));
    } else if (specs.isExpensive) {
      candidates = COPIES_PRODUTOS_GERAIS.filter((e) => ['FIT-01', 'FIT-02', 'ELE-03', 'ELE-06', 'ELE-07', 'ENE-01', 'MOB-04'].includes(e.id));
    } else {
      // Copies reais super versáteis do banco que se adaptam perfeitamente a qualquer produto (tinta, utilidades, casa, etc.)
      candidates = COPIES_PRODUTOS_GERAIS.filter((e) =>
        ['ELE-03', 'ELE-06', 'ELE-07', 'ENE-01', 'FIT-01', 'FIT-02', 'CLI-01', 'CLI-02', 'LIM-01', 'CAS-03'].includes(e.id)
      );
    }
    if (candidates.length === 0) {
      candidates = activeBank;
    }
  }

  // Em 8s, já dá preferência para falas da memória do app que possuem menos de 165 caracteres (Item 9)
  let pool = candidates;
  if (duration === 8) {
    const shortPool = candidates.filter((c) => c.fits8s || c.charCount <= 165 || c.text.length <= 165);
    // Só restringe se houver pelo menos 2 opções curtas; se houver apenas 1, mantém a lista completa
    // para não viciar sempre na mesma copy única (Item 11)
    if (shortPool.length >= 2) {
      pool = shortPool;
    }
  }

  // Anti-repetição inteligente (Item 11): se houver 2 ou mais opções, evita repetir as últimas escolhidas
  let poolToPick = pool;
  if (pool.length > 1) {
    const nonRepeated = pool.filter((c) => !recentPickedCopyIds.includes(c.id));
    if (nonRepeated.length > 0) {
      poolToPick = nonRepeated;
    }
  }

  if (excludeCopyId) {
    const withoutExcluded = poolToPick.filter((c) => c.id !== excludeCopyId);
    if (withoutExcluded.length > 0) {
      poolToPick = withoutExcluded;
    } else {
      const activeWithoutExcluded = activeBank.filter((c) => c.id !== excludeCopyId);
      if (activeWithoutExcluded.length > 0) {
        poolToPick = activeWithoutExcluded;
      }
    }
  }

  const chosen = pickUniformRandom(poolToPick);
  recentPickedCopyIds.push(chosen.id);
  if (recentPickedCopyIds.length > 10) {
    recentPickedCopyIds.shift();
  }

  const resolvedInf: 'Homem' | 'Mulher' =
    influencer ||
    specs.influencer ||
    (chosen.audience === 'Masculino' ? 'Homem' : 'Mulher');

  const isSameProduct = matchPriority === 'mesmo_produto';

  const adapted = calibrateCopyToTargetWindow({
    copy: adaptBankCopyToProduct(chosen, cleanName, productInfo, specs, clientGender, resolvedInf, isSameProduct),
    duration,
    isSameProductBankCopy: true,
    clientGender,
    influencer: resolvedInf,
    useSpeechIntro,
  });

  const sourceDesc =
    matchPriority === 'mesmo_produto'
      ? `Copy ${chosen.id} (${chosen.productType}) — Mesmo Produto (${chosen.niche})`
      : matchPriority === 'mesmo_nicho'
      ? `Copy ${chosen.id} (${chosen.productType}) adaptada — Mesmo Nicho: ${chosen.niche}`
      : matchPriority === 'nicho_vizinho'
      ? `Copy ${chosen.id} (${chosen.productType}) adaptada — Nicho: ${chosen.niche}`
      : `Copy ${chosen.id} (${chosen.productType}) do banco adaptada para ${cleanName}`;

  const freeShipping = hasExplicitFreeShipping(`${productName} ${productInfo}`);
  const safeFinalCopy = sanitizeFreeShippingMentions(adapted, freeShipping);

  return {
    finalCopy: safeFinalCopy,
    copyId: chosen.id,
    copySourceLabel: sourceDesc,
    archetype: chosen.archetype,
    resolvedInfluencer: resolvedInf,
    isSameProductBankCopy: isSameProduct,
    baseEntry: chosen,
  };
}

/**
 * SEÇÃO 5 — Adapta uma copy real do banco mudando o MÍNIMO POSSÍVEL:
 * - Se for o mesmo produto: mantém 99% intacto, atualizando apenas números reais (Watts/ml/polegadas) e gênero/vocativo.
 * - Se for outro produto do mesmo nicho ou outra copy do banco: mantém o gancho, o ritmo, as frases de efeito e o CTA
 *   exatos da copy do banco, trocando apenas o nome do produto antigo pelo novo (com a concordância correta esse/essa)
 *   e substituindo somente o trecho que falava de peças exclusivas do produto antigo pelas características reais do novo.
 */
export function adaptBankCopyToProduct(
  entry: CopyBankEntry,
  productName: string,
  productInfo: string,
  specs: ProductSpecsExtracted,
  clientGender: Produtos2ClientGender,
  influencer: 'Homem' | 'Mulher',
  isSameProductForce?: boolean
): string {
  let text = entry.text;
  const entryProdNorm = normalizeAccents(entry.productType);
  const targetProdNorm = normalizeAccents(productName);

  const isSameProductType =
    isSameProductForce !== undefined
      ? isSameProductForce
      : Boolean(targetProdNorm && (entryProdNorm.includes(targetProdNorm) || targetProdNorm.includes(entryProdNorm)));

  const spokenName = (productName || '')
    .trim()
    .split(/\s+/)
    .map((w) => (/^(4K|LED|RGB|USB|RMS|TNT|UV|GPS|BML|JBL|TV|HD|3D|5G)$/i.test(w) ? w.toUpperCase() : w.toLowerCase()))
    .join(' ');
  const isFem = isFeminineProductName(spokenName);
  const esseProd = isFem ? `essa ${spokenName}` : `esse ${spokenName}`;
  const EsseProd = isFem ? `Essa ${spokenName}` : `Esse ${spokenName}`;
  const esteProd = isFem ? `esta ${spokenName}` : `este ${spokenName}`;
  const desseProd = isFem ? `dessa ${spokenName}` : `desse ${spokenName}`;
  const umProd = isFem ? `uma ${spokenName}` : `um ${spokenName}`;
  const oSeu = isFem ? 'a sua' : 'o seu';

  // REGRA MESTRE DE MODELOS E MARCAS:
  // Se a copy sorteada menciona um modelo/marca específico do banco (ex: BML S26 Ultra, Poco X8 Pro, monitor Valac Z18, Galfolk, etc.)
  // e o produto atual do usuário NÃO for exatamente aquele modelo, substitui OBRIGATORIAMENTE pelo nome/modelo real do usuário,
  // mesmo se o produto pertencer à mesma categoria (ex: Celular ou Monitor)!
  if (productName && spokenName) {
    if (!/bml|s26\s*ultra/i.test(targetProdNorm)) {
      text = text
        .replace(/\bmeu\s+BML\s+S26\s+Ultra\b/gi, `meu ${spokenName}`)
        .replace(/\bBML\s+S26\s+Ultra\b/gi, spokenName);
    }
    if (!/poco\s*x8\s*pro/i.test(targetProdNorm)) {
      text = text
        .replace(/\bo\s+novo\s+Poco\s+X8\s+Pro\b/gi, `o novo ${spokenName}`)
        .replace(/\bEsse\s+é\s+o\s+novo\s+Poco\s+X8\s+Pro\b/gi, `${EsseProd} é sensacional`)
        .replace(/\bPoco\s+X8\s+Pro\b/gi, spokenName);
    }
    if (!/valac\s*z18/i.test(targetProdNorm)) {
      text = text
        .replace(/\bEsse\s+monitor\s+Valac\s+Z18\s+Maze\b/gi, EsseProd)
        .replace(/\bmonitor\s+Valac\s+Z18\s+Maze\b/gi, spokenName)
        .replace(/\bValac\s+Z18\s+Maze\b/gi, spokenName);
    }
    if (!/galfolk|gawfolk/i.test(targetProdNorm)) {
      text = text
        .replace(/\besse\s+monitor\s+Galfolk\b/gi, esseProd)
        .replace(/\bmonitor\s+Galfolk\b/gi, spokenName)
        .replace(/\bGalfolk\b/gi, spokenName);
    }
    if (!/bomber\s*bbx/i.test(targetProdNorm)) {
      text = text.replace(/\bo\s+Bomber\s+BBX(?:\s+de\s+6\s+polegadas)?\b/gi, esseProd);
    }
    if (!/bravox/i.test(targetProdNorm)) {
      text = text.replace(/\besse\s+kit\s+Bravox\b/gi, esseProd);
    }
    if (!/hurricane/i.test(targetProdNorm)) {
      text = text.replace(/\besse\s+kit\s+com\s+4\s+alto-falantes\s+Hurricane(?:\s+de\s+6\s+polegadas)?\b/gi, esseProd);
    }
    if (!/jbl/i.test(targetProdNorm)) {
      text = text.replace(/\bo\s+triaxial\s+da\s+JBL\b/gi, esseProd);
    }
    if (!/viniflex|vabani/i.test(targetProdNorm)) {
      text = text.replace(/\bdessa\s+Viniflex\s+da\s+Vabani\b/gi, desseProd);
    }
    if (!/buffalo/i.test(targetProdNorm)) {
      text = text.replace(/\bEsse\s+motocultivador\s+Buffalo(?:\s+de\s+7\s+cavalos)?\b/gi, EsseProd);
    }
    if (!/triciclo\s*drift/i.test(targetProdNorm)) {
      text = text.replace(/\bo\s+meu\s+Triciclo\s+Drift\b/gi, esseProd);
    }
  }

  if (!isSameProductType && productName) {
    const { conciseFeatureSentence, shortWithClause } = buildMinimalReplacementClauses(
      productName,
      productInfo,
      specs,
      isFem
    );

    // Adaptações cirúrgicas por ID quando a copy tem uma frase exclusiva do produto antigo,
    // preservando todo o resto da copy original do banco 100% intacto!
    switch (entry.id) {
      case 'FIT-01':
        // Original: "Agora é oficial, o TikTok endoidou. Essa esteira elétrica dobrável caiu pra menos da metade. Silenciosa, com controle e painel LED. E ainda suporta até 100 quilos. A parcela é menos que uma pizza. Acaba hoje. Clica no carrinho agora."
        text = `Agora é oficial, o TikTok endoidou. ${EsseProd} caiu pra menos da metade. ${conciseFeatureSentence} A parcela é menos que uma pizza. Acaba hoje. Clica no carrinho agora.`;
        break;

      case 'FIT-02':
        // Original: "Não dá nem pra acreditar que tá por esse preço. Essa esteira ergométrica tá saindo por preço de fábrica. Então, se você tá cansada de não conseguir treinar quando chove ou quer um impulso quando dá aquela preguicinha, é pra você."
        if (entry.niche === specs.niche || /banco|treino|exercicio|halter|fitness|academia|bicicleta/i.test(normalizeAccents(`${productName} ${productInfo}`))) {
          text = text.replace(/\bEssa esteira ergométrica\b/i, EsseProd);
        } else {
          text = `Não dá nem pra acreditar que tá por esse preço. ${EsseProd} tá saindo por preço de fábrica. ${conciseFeatureSentence} Então, se você quer praticidade de verdade no dia a dia sem gastar caro, é pra você.`;
        }
        break;

      case 'ELE-06':
        // Original: "Agora é oficial, o TikTok endoidou. Esse monitor Valac Z18 Maze baixou mais da metade, com tela curva super imersiva e imagens muito nítidas, com a parcela menos que uma pizza. Clica no carrinho!"
        text = `Agora é oficial, o TikTok endoidou. ${EsseProd} baixou mais da metade, ${shortWithClause}, com a parcela menos que uma pizza. Clica no carrinho!`;
        break;

      case 'ELE-07':
        // Original: "Últimas 20 unidades em estoque. O TikTok tá dando quase de graça esse monitor Galfolk. Por esse preço tem gente comprando pra revender, não dá nem pra acreditar. Eu, se fosse você, não deixava passar. Aproveita e clica no carrinho."
        text = text.replace(/\besse monitor Galfolk\b/i, esseProd);
        break;

      case 'ENE-01':
        // Original: "Gente, o TikTok deve ter ficado maluco! Olha esse produto aqui, eu cliquei achando que era brincadeira, mas o preço é de verdade. Se o botão laranja ainda estiver aparecendo para você, clique nele, porque deve esgotar rapidamente."
        text = text.replace(/\besse produto aqui\b/i, `${esseProd} aqui`);
        break;

      case 'ELE-03':
        // Original: "Olha o preço disso aqui agora! Acabou de entrar em oferta relâmpago e tem muita gente conseguindo pegar com frete grátis. Aproveita, que só vai até a meia-noite. Eu vou deixar o link com desconto aqui no carrinho laranja. Já clica e pega o seu antes que acabe!"
        text = text
          .replace(/\bOlha o preço disso aqui agora!/i, `Olha o preço ${desseProd} agora!`)
          .replace(/\bpega o seu\b/i, `pega ${oSeu}`);
        break;

      case 'CLI-01':
        // Original: "Finalmente esse ventilador de mesa 40 cm Turbo entrou numa ótima promoção. Não passe mais calor, garanta o seu agora mesmo com desconto promocional."
        text = `Finalmente ${esseProd} entrou numa ótima promoção. ${conciseFeatureSentence} Garanta ${oSeu} agora mesmo com desconto promocional.`;
        break;

      case 'CLI-02':
        // Original: "Tá calor? Então aproveita! Esses ventiladores estão com preço muito bom aí na promoção. Tem gente comprando até para revender. Corre e confira no carrinho!"
        text = `Olha essa oportunidade! ${EsseProd} tá com preço muito bom aí na promoção. Tem gente comprando até para revender. Corre e confira no carrinho!`;
        break;

      case 'CLI-03':
      case 'CLI-04':
      case 'CLI-05': {
        const qty = specs.kitQuantity && specs.kitQuantity >= 2 ? specs.kitQuantity : 2;
        const qtyWord = qty === 2 ? (isFem ? 'Duas' : 'Dois') : qty === 3 ? 'Três' : `Kit com ${qty}`;
        const qtyNumWord = qty === 2 ? (isFem ? 'duas' : 'dois') : qty === 3 ? 'três' : `${qty}`;
        const umWord = isFem ? 'uma' : 'um';
        const osSeus = isFem ? 'as suas' : 'os seus';
        text = text
          .replace(/^Dois ventiladores/i, `${qtyWord} ${spokenName}`)
          .replace(/\bmal paga um\b/i, `mal paga ${umWord}`)
          .replace(/\bmal compra um\b/i, `mal compra ${umWord}`)
          .replace(/\bleva dois de uma vez\b/i, `leva ${qtyNumWord} de uma vez`)
          .replace(/\bpra refrescar sua casa, quarto ou trabalho\b/i, 'pro seu dia a dia')
          .replace(/\bgarante os seus\b/i, `garante ${osSeus}`);
        break;
      }

      case 'LIM-01':
        // Original: "Tá cansada daquelas luvas que rasgam por qualquer coisinha? Olha a resistência dessa Viniflex da Vabani. O ajuste é perfeito e não tem aquele pó chato pra sujar a mão. A sensibilidade ao toque é surreal. Serve pra comida, limpeza, estética, tudo que você imaginar. Vem 100 unidades na caixa, rende demais. Clica no carrinho e garante a sua."
        text = `Olha a qualidade ${desseProd} que acabou de chegar. ${conciseFeatureSentence} O resultado é impecável e rende demais no uso. Clica no carrinho e garante ${oSeu}.`;
        break;

      case 'CAS-01': {
        const isOrganizer = /organizador|rack|armario|estante|sapateira|cesto|gaveteir|suporte|banheiro/i.test(targetProdNorm);
        if (isOrganizer) {
          text = `Quer mais praticidade e organização sem dor de cabeça? Olha isso! É ${umProd} ${shortWithClause}. ${conciseFeatureSentence} Garante ${oSeu} aqui no link.`;
        } else {
          text = `Olha a qualidade ${desseProd} que acabou de chegar. ${conciseFeatureSentence} O resultado é incrível pro seu dia a dia. Garante ${oSeu} aqui no link.`;
        }
        break;
      }

      case 'RED-01':
        text = `Olha que delícia de achado! ${EsseProd} ${shortWithClause || 'feita em 100% algodão super macia e resistente'}. Perfeita pra relaxar com conforto total e tirar aquele cochilo. Clica no carrinho e garante ${oSeu}!`;
        break;

      case 'RED-02':
        text = `Quer descansar de verdade e tirar aquele cochilo gostoso? ${EsseProd} ${shortWithClause || 'em algodão reforçado'} é puro conforto, não esquenta e aguenta o tranco. Clica aqui embaixo e garante ${oSeu}!`;
        break;

      case 'CAS-03':
        text = `Olha a qualidade ${desseProd}: ${shortWithClause}. É super fácil de usar e já transforma o ambiente na hora, fica com acabamento de primeira. Clica no link pra garantir ${oSeu}.`;
        break;

      case 'COZ-01':
        text = `Gente, olha essa loucura! Todo mundo correndo pra pegar ${esseProd}, mas já garanti! Acabei de trazer pra casa, olha que design lindo e super moderno! Testei hoje mesmo: ${conciseFeatureSentence} Vamos pro carrinho agora, esse modelo esgota num piscar de olhos, não fiquem sem!`;
        break;

      case 'JAR-01':
        text = `Gente, acabou de chegar ${esseProd}. ${conciseFeatureSentence} Facilitou demais o serviço sem fazer esforço. Pra cuidar de tudo com rapidez, dá uma olhada por aqui.`;
        break;

      case 'AGR-01':
        text = `Quer fazer o serviço com muito mais praticidade? ${EsseProd} ${shortWithClause}, ideal para o trabalho pesado. Uma máquina forte de verdade. Toque no carrinho laranja!`;
        break;

      case 'FER-01':
        text = `Ainda sofrendo no serviço manual? Olha ${esseProd}! ${conciseFeatureSentence} Confere no carrinho!`;
        break;

      case 'FER-02':
        text = `Gente, olha esse achado! ${EsseProd} entrou em superoferta. ${conciseFeatureSentence} Entrega um acabamento perfeito. Tem envio para todo o Brasil, gente! Corre e clica aqui embaixo, no carrinho, pra garantir ${oSeu}.`;
        break;

      case 'BEL-01':
        text = `Gente, achei ${esseProd} perfeito. ${conciseFeatureSentence} Olha isso, a qualidade é linda. Clica aqui embaixo pra ver.`;
        break;

      case 'BEL-02':
        text = `Olha ${esseProd} que acabou de chegar. Esquenta super rápido e entrega resultado de salão sem esforço e com segurança total. ${conciseFeatureSentence} Clica no carrinho e garante ${oSeu}.`;
        break;

      case 'MOB-04':
        text = text
          .replace(/\besta bicicleta elétrica\b/i, esteProd)
          .replace(/\bEla me leva para onde preciso e economiza\b/i, `Facilita demais a rotina e economiza`)
          .replace(/\bcompre a sua\b/i, `compre ${oSeu}`);
        break;

      default: {
        // Substituição direta do nome do produto mantendo o restante da copy intacto
        const replacements: [RegExp, string][] = [
          [/\bdessa vara de carbono\b/gi, desseProd],
          [/\ba vara de carbono ultralight\b/gi, esseProd],
          [/\bdessa vara de carbono ultralight\b/gi, desseProd],
          [/\besse amplificador automotivo\b/gi, esseProd],
          [/\bdo amplificador\b/gi, desseProd],
          [/\bdesse alto-falante\b/gi, desseProd],
          [/\bo Bomber BBX de 6 polegadas\b/gi, esseProd],
          [/\besse kit Bravox\b/gi, esseProd],
          [/\besse alto-falante de 8 polegadas\b/gi, esseProd],
          [/\besse kit com 4 alto-falantes Hurricane de 6 polegadas\b/gi, esseProd],
          [/\bo triaxial da JBL\b/gi, esseProd],
          [/\bessa scooter elétrica retrô\b/gi, esseProd],
          [/\bessa bike elétrica\b/gi, esseProd],
          [/\besta bicicleta elétrica\b/gi, esteProd],
          [/\bessa e-bike\b/gi, esseProd],
          [/\besse ventilador de mesa 40 cm Turbo\b/gi, esseProd],
          [/\bessa panificadora\b/gi, esseProd],
          [/\ba garrafinha\b/gi, esseProd],
          [/\bpela minha garrafa\b/gi, `por ${esseProd}`],
          [/\ba garrafa térmica\b/gi, esseProd],
          [/\besse pulverizador elétrico\b/gi, esseProd],
          [/\bo elástico\b/gi, esseProd],
          [/\bessa escova de cerâmica\b/gi, esseProd],
          [/\bum rack de chão\b/gi, umProd],
          [/\bdessa Viniflex da Vabani\b/gi, desseProd],
          [/\bessa câmera digital\b/gi, esseProd],
          [/\bno relógio da maçã\b/gi, `em ${spokenName} caro`],
          [/\bo novo Poco X8 Pro\b/gi, esseProd],
          [/\bmeu BML S26 Ultra\b/gi, esseProd],
          [/\bEsse monitor Valac Z18 Maze\b/gi, EsseProd],
          [/\besse monitor Galfolk\b/gi, esseProd],
          [/\bnesse tablet lançamento\b/gi, `n${esseProd}`],
          [/\bum jipe elétrico desses\b/gi, `${umProd} desses`],
          [/\besse jipe elétrico\b/gi, esseProd],
          [/\bEsse triciclo elétrico\b/gi, EsseProd],
          [/\bo meu Triciclo Drift\b/gi, esseProd],
          [/\besse triciclo elétrico\b/gi, esseProd],
          [/\bEssa esteira elétrica dobrável\b/gi, EsseProd],
          [/\bEssa esteira ergométrica\b/gi, EsseProd],
          [/\bEssa bateria\b/gi, EsseProd],
          [/\besse alicate hidráulico à bateria\b/gi, esseProd],
          [/\bEssa punção elétrica hidráulica\b/gi, EsseProd],
          [/\bEsse motocultivador Buffalo de 7 cavalos\b/gi, EsseProd],
          [/\bessa pedaleira\b/gi, esseProd],
        ];

        for (const [regex, rep] of replacements) {
          if (regex.test(text)) {
            text = text.replace(regex, rep);
            break;
          }
        }
        break;
      }
    }
  }

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

  // Regra da pizza (Item 8): NUNCA dizer somente "menos que uma pizza", sempre "a parcela é menos que uma pizza"
  text = text.replace(/(?:(?:com\s+)?a\s+parcela\s+[eé]\s+)*(?:com\s+a\s+parcela\s+)?(?:por\s+)?menos\s+que\s+uma\s+pizza/gi, (match) => {
    return match.toLowerCase().includes('com')
      ? 'com a parcela menos que uma pizza'
      : 'a parcela é menos que uma pizza';
  });
  if (text.startsWith('a parcela é menos que uma pizza')) {
    text = 'A parcela é menos que uma pizza' + text.slice('a parcela é menos que uma pizza'.length);
  }

  // Regra de Frete Grátis: NUNCA colocar frete grátis na copy a menos que tenha sido informado diretamente
  const freeShipping = hasExplicitFreeShipping(`${productName} ${productInfo}`);
  text = sanitizeFreeShippingMentions(text, freeShipping);

  return text;
}

/**
 * Gera automaticamente a Descrição do Post + Hashtags para TikTok / Reels (Modo Produtos 2.0)
 * baseado no nome do produto, nicho, categoria e palavras-chave de alta conversão.
 */
export function generateProdutos2DescriptionHashtags(params: {
  productName: string;
  niche?: string;
  subMode?: Produtos2SubMode;
  maleSubOption?: Produtos2MaleSubOption;
  clientGender?: Produtos2ClientGender;
  finalCopy?: string;
}): { description: string; hashtags: string[] } {
  const { productName, niche, subMode, maleSubOption } = params;
  const rawName = (productName || 'Produto').trim();
  const cleanTitle = rawName.replace(/[!.]+$/, '');
  const normName = normalizeAccents(rawName.toLowerCase());
  const normNiche = normalizeAccents((niche || '').toLowerCase());

  const tags: string[] = [];

  // 1. Tag específica limpa do produto (ex: #pocox8pro, #redededescanso, #tenismasculino)
  const productTagSlug = normName
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24);
  if (productTagSlug.length >= 3) {
    tags.push(`#${productTagSlug}`);
  }

  // 2. Tags de nicho e categoria
  if (normNiche.includes('feminino') || normNiche.includes('moda feminina')) {
    tags.push('#modafeminina', '#lookdodia', '#tendencia');
    if (normName.includes('vestido')) tags.push('#vestidofeminino');
    else if (normName.includes('calca')) tags.push('#calcafeminina');
    else if (normName.includes('conjunto')) tags.push('#conjuntofeminino');
    else if (normName.includes('pijama') || normName.includes('camisola')) tags.push('#pijamafeminino');
    else if (normName.includes('tenis') || normName.includes('sapato')) tags.push('#calcadosfemininos');
  } else if (
    subMode === 'vestuario_masculino' ||
    maleSubOption === 'calcados' ||
    maleSubOption === 'roupas' ||
    normNiche.includes('masculino') ||
    normNiche.includes('calcados masculinos') ||
    normNiche.includes('roupas masculinas')
  ) {
    tags.push('#modamasculina', '#estilomasculino');
    if (maleSubOption === 'calcados' || normName.includes('tenis') || normName.includes('sapato') || normName.includes('bota')) {
      tags.push('#calcadosmasculinos', '#tenismasculino');
    } else {
      tags.push('#roupasmasculinas');
      if (normName.includes('camisa') || normName.includes('camiseta')) tags.push('#camisetamasculina');
      else if (normName.includes('bermuda') || normName.includes('short')) tags.push('#bermudamasculina');
    }
  } else if (normNiche.includes('eletron') || normName.includes('celular') || normName.includes('poco') || normName.includes('monitor') || normName.includes('fone')) {
    tags.push('#eletronicos', '#tecnologia', '#tech', '#dicasdetecnologia');
    if (normName.includes('celular') || normName.includes('poco') || normName.includes('smartphone')) {
      tags.push('#celular', '#smartphone');
    } else if (normName.includes('monitor')) {
      tags.push('#setupgamer', '#monitorgamer');
    }
  } else if (normNiche.includes('casa') || normNiche.includes('cozinha') || normName.includes('rede') || normName.includes('ventilador') || normName.includes('garrafa')) {
    tags.push('#achadinhosdecasa', '#dicasdecasa', '#utilidadesdomesticas', '#casaorganizada');
    if (normName.includes('rede')) tags.push('#redededescanso', '#confortoemcasa');
  } else if (normNiche.includes('ferramenta') || normNiche.includes('jardim') || normNiche.includes('agro') || normName.includes('rocadeira') || normName.includes('furadeira')) {
    tags.push('#ferramentas', '#construcao', '#jardim', '#dicasuteis');
  } else if (normNiche.includes('beleza') || normNiche.includes('saude') || normName.includes('escova') || normName.includes('cabelo') || normName.includes('skincare')) {
    tags.push('#dicasdebeleza', '#beleza', '#autocuidado', '#skincare');
  } else if (normNiche.includes('fitness') || normName.includes('esteira') || normName.includes('treino') || normName.includes('academia')) {
    tags.push('#fitness', '#treinoemcasa', '#vidasaudavel', '#academia');
  } else if (normNiche.includes('auto') || normNiche.includes('som') || normName.includes('alto-falante') || normName.includes('amplificador')) {
    tags.push('#somautomotivo', '#carros', '#automotivo');
  } else {
    tags.push('#achadinhos', '#utilidades');
  }

  // 3. Tags universais virais de compras TikTok / Reels
  const viralShoppingTags = ['#achadinhos', '#tiktokcompras', '#comprinhas', '#tiktokmademebuyit', '#review'];
  for (const vTag of viralShoppingTags) {
    if (!tags.includes(vTag) && tags.length < 8) {
      tags.push(vTag);
    }
  }

  // Limitar a 7-8 tags únicas
  const uniqueTags = Array.from(new Set(tags)).slice(0, 8);
  const fullDescription = `${cleanTitle}! ${uniqueTags.join(' ')}`;

  return {
    description: fullDescription,
    hashtags: uniqueTags,
  };
}

