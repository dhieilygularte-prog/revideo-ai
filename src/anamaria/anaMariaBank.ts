import { AnaMariaInfluencer, AnaMariaBodyType } from './types';

export type ProductCategoryGroup =
  | 'vestido'
  | 'conjunto'
  | 'conjunto_fitness'
  | 'macaquinho_macacao'
  | 'bermuda_shorts'
  | 'calca'
  | 'saia'
  | 'blusa_camiseta'
  | 'babydoll_camisola_pijama'
  | 'lingerie_body'
  | 'moda_praia'
  | 'cinta_modeladora'
  | 'jaqueta_casaco'
  | 'outro';

export interface HeadlineEntry {
  headline: string;
  hashtags: string;
  flowerSymbol?: string;
  sourceProduct?: string;
}

export interface AnaMariaBankEntry {
  id: string;
  product: string;
  headline: string;
  hashtags: string;
  keywords: string[];
  flowerSymbol: string;
  category: 'fitness' | 'cinta' | 'vestido' | 'macaquinho' | 'calca' | 'pijama' | 'blusa' | 'geral';
}

/**
 * BANCO DE MEMÓRIA AGRUPADO POR CATEGORIA DE PRODUTO
 * Cada grupo contém exclusivamente as headlines e hashtags reais testadas para aquele tipo de vestuário.
 * Regra do usuário: NUNCA misturar hashtags ou textos entre categorias (ex: nunca atribuir tag de bermuda a vestido).
 * A cada geração de um produto daquela categoria, uma headline/hashtag é selecionada de forma randômica do grupo.
 */
export const PRODUCT_HEADLINES_GROUPED: Record<
  Exclude<ProductCategoryGroup, 'outro'>,
  { label: string; items: HeadlineEntry[] }
> = {
  vestido: {
    label: 'Vestidos (Curtos, Midis, Longos, Elegantes)',
    items: [
      {
        headline: 'Pov : você achou seu look\nDe Ano Novo e Natal\n✨🤍❤️🎄',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Qualquer mulher arrasa\ncom um vestido desse\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Loucura como esse vestido\né perfeito\n🌸🤍',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Pov : você encontrou o look\nPERFEITO pro NATAL\n❤️✨🎄',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Loucura como esse vestido\né simplesmente Lindo\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'A sensação de um vestido\nque te deixa super elegante\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Achei o vestido perfeito\nPro natal\n❤️✨🎄',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Loucura como esse\nvestido é lindo\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'O vestido que faz qualquer\nmulher arassar\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Essa vestido\ntá QUASE de graça\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido perfeito\ntoda mulher devia\nter um\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido longo super lindo\ntá muito barato\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'A perfeição desse vestidinho\nfaz qualquer mulher arrasar\n🌸🤍',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Já achei meu vestido\nPERFEITO pro Natal\n🎄❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Sim esse vestidinho PERFEITO\ntá muito barato\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Surreal como esse vestidinho\nlindo tá quase de graça\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Loucura como esse Vestidinho\nPerfeito tá tão barato\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'esse vestido lindo\nperfeito tá muito baratinho\n✨🌸',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Surreal como esse vestido\nlindo tá quase de graça\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Loucura como esse vestido\nPERFEITO tá quase de graça\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Sim, toda mulher devia ter\num vestido longo lindo desse\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido PERFEITO\nTá quase de graça\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Toda mulher devia ter\num vestido\nlindo desse\n🌸💮🩵',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Surreal o valor\ndesse vestido longo\nlindíssimo\n✨✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Não acredito\no valor desse\nVestido perfeito\n✨🌸',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Loucura como esse vestido\nPERFEITO tá tão barato\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Vestido',
      },
    ],
  },
  conjunto: {
    label: 'Conjuntos Casuais, Moletom e Sociais',
    items: [
      {
        headline: 'Loucura como esse conjunto\nperfeito tá muito barato\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Loucura como esse\nConjunto é PERFEITO\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Essa conjunto tricot\nPerfeita tá muito barato\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Loucura como esse\nConjunto é PERFEITO\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Essa conjunto\nperfeito tá muito barato\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Toda mulher devia ter um\nConjunto maravilhoso desse\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'O conjunto perfeito\nque toda mulher devia ter\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Loucura o quanto esse conjunto\né PERFEITO\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Toda mulher arrasa com um\nconjunto lindo desse',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'loucura como esse conjunto\né tão PERFEITO\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Surreal como esse conjuntinho\nlindo tá quase de graça\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Qualquer mulher arrasa\ncom um conjunto fitness\ndesse ✨🤍',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Loucura como esse conjunto\nÉ PERFEITO\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Sim, toda mulher devia ter\num conjunto pft desse\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Esse conjunto tá\nquase de graça\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Loucura como esse conjunto\né PERFEITO\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Loucura como esse conjunto\nÉ PERFEITO\n❤️✨🎄',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Conjunto',
      },
    ],
  },
  conjunto_fitness: {
    label: 'Moda Fitness, Treino e Academia',
    items: [
      {
        headline: 'Amo treinar feminina 💗',
        hashtags: '#conjunto #fitness #treino',
        flowerSymbol: '💗',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'CHOCADA com o caimento Desse conjunto fitness Baratinho ✨😍',
        hashtags: '#gym #conjunto #modafitness',
        flowerSymbol: '😍',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'E esse conjuntinho perfeito 💙',
        hashtags: '#fy #gym',
        flowerSymbol: '💙',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Esse conjuntinho lindo está tão barato ✨🤍',
        hashtags: '#fyp #foryou #conjunto #gym',
        flowerSymbol: '🤍',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Esse conjunto lindo está muito barato ✨',
        hashtags: '#fyp #foryou #gym',
        flowerSymbol: '✨',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Esse conjunto perfeito está muito barato ✨🤍',
        hashtags: '#gym #conjunto #modafitness #treino #fitness',
        flowerSymbol: '🤍',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'esse conjunto perfeito tá quase de graça 💔',
        hashtags: '#gym #treino #fyp #foryou',
        flowerSymbol: '💔',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'macaquinho lindo está tão barato 💜',
        hashtags: '#treino #gym #conjunto',
        flowerSymbol: '💜',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Um conjunto fitness que fala mais que mil palavras 🥺✨❤️',
        hashtags: '#conjunto #fitness #modafitness',
        flowerSymbol: '️',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Esse conjuntinho lindo está tão barato 🥺',
        hashtags: '#gym #fyp #foryou #conjunto',
        flowerSymbol: '🥺',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'E esse conjuntinho perfeito 🤍',
        hashtags: '#fy #gym',
        flowerSymbol: '🤍',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'esse conjunto perfeito tá quase de graça ✿',
        hashtags: '#gym #treino #fyp #foryou',
        flowerSymbol: '✿',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Esse conjuntinho lindo está tão barato 🌸',
        hashtags: '#fyp #foryou #gym',
        flowerSymbol: '🌸',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Um conjunto fitness que fala mais que mil palavras 🥺✨❤️',
        hashtags: '#conjunto #fitness #treino',
        flowerSymbol: '️',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Esse conjuntinho lindo está tão barato ✨🤍',
        hashtags: '#fyp #gym #conjunto #modafitness #treino',
        flowerSymbol: '🤍',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Esse conjunto perfeito está muito barato ✨🤍',
        hashtags: '#conjunto #fitness #treino #modafitness #gym',
        flowerSymbol: '🤍',
        sourceProduct: 'Conjunto fitness',
      },
    ],
  },
  macaquinho_macacao: {
    label: 'Macacões e Macaquinhos',
    items: [
      {
        headline: 'Sim, toda mulher devia ter\num macacão pft desse\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Macacão',
      },
      {
        headline: 'Apaixonada nesse macacão longo\ntoda mulher devia ter\n✨🤎',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Macacão',
      },
      {
        headline: 'Loucura como esse macacão\nPerfeito tá quase de graça\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Macacão',
      },
      {
        headline: 'Esse macacão perfeito\ntoda mulher devia ter\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Macacão',
      },
    ],
  },
  bermuda_shorts: {
    label: 'Bermudas e Shorts',
    items: [
      {
        headline: 'Tô amando usar essa saída de praia shorts saia 🌞',
        hashtags: '#saidadepraia #shortsaia #modafeminina #achadinhos',
        flowerSymbol: '🌞',
        sourceProduct: 'Short saia / saída de praia',
      },
      {
        headline: 'Agora sim entendi o motivo dessa bermuda sempre tá esgotada ❀',
        hashtags: '#bermuda #modafeminina #look #fyp #achadinhos',
        flowerSymbol: '❀',
        sourceProduct: 'Bermuda',
      },
      {
        headline: 'Esse shortinho lindo está tão barato ✿',
        hashtags: '#shorts #shortinho #modafeminina #fyp #lookdodia',
        flowerSymbol: '✿',
        sourceProduct: 'Shorts',
      },
      {
        headline: 'Essa bermuda entrega tudo no caimento ✨💛',
        hashtags: '#bermuda #alfaiataria #lookdodia #modafeminina #fyp',
        flowerSymbol: '✨',
        sourceProduct: 'Bermuda alfaiataria',
      },
      {
        headline: 'Esse shortinho é surreal de lindo e confortável ❀',
        hashtags: '#shorts #shortjeans #modafeminina #foryou #achadinhos',
        flowerSymbol: '❀',
        sourceProduct: 'Shorts',
      },
      {
        headline: 'Agora entendi porque essa bermuda vive esgotada ✨',
        hashtags: '#bermuda #modafeminina #achadinhos #fyp #looks',
        flowerSymbol: '✨',
        sourceProduct: 'Bermuda',
      },
      {
        headline: 'O caimento desse shorts no corpo é surreal ✿',
        hashtags: '#shorts #modafeminina #tiktokshop #look #foryou',
        flowerSymbol: '✿',
        sourceProduct: 'Shorts',
      },
    ],
  },
  calca: {
    label: 'Calças (Linho, Jeans, Pantalona, Alfaiataria e Meia-Calça)',
    items: [
      {
        headline: 'Essa calça folgada é tão... 🫦✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Loucura como essa\ncalça jeans é perfeita\n🌸🏵️💮',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Loucura como essa calça\nFolgada é PERFEITA\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Loucura como essa calça\né PERFEITA\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Sério, essa calça aqui\ntá PERFEITA\n✨🥰',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Toda mulher merece uma\nCalça perfeita dessa\n✨✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Essa calça perfeita\ntá Quase de graça 🫦',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Loucura como essa calça\nPERFEITA tá tão barata\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Loucura como essa calça\nÉ Tão PERFEITA\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Toda mulher arrasa\ncom uma calça dessa\n🌸🏵️💮',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Loucura como essa calça\nÉ PERFEITA\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Toda mulher devia ter\nUma calça dessa 🤍',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Toda mulher tem que ter\numa calça linda dessa\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Essa calça perfeita\ntá quase de graça\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Essa calça de alfaiataria é\nPERFEITA 🤍',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'A calça perfeita\nque toda mulher devia ter\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Toda mulher arrasa com uma\nCalça jeans perfeita\ndesse\n✨✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'A calça que faz qualquer\nmulher arassar\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Essa calça de alfaiataria\nperfeita tá tão\nbarata\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Essa calça folgada\né tão... 🫦',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Calça',
      },
    ],
  },
  saia: {
    label: 'Saias (Midi, Mini, Evasê e Saia Pinterest)',
    items: [
      {
        headline: 'Surreal quanto essa\nSaia longa é linda\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Saia',
      },
      {
        headline: 'Toda mulher devia ter uma\nsaia perfeita dessa 🫦',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Saia',
      },
      {
        headline: 'Loucura como essa saia\nperfeita tá muito barata\n✨❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Saia',
      },
      {
        headline: 'A saia longa perfeita que\nnão pode faltar no guarda roupa\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Saia',
      },
      {
        headline: 'Loucura como essa saia\nÉ PERFEITAA\n❤️✨🎄',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Saia',
      },
      {
        headline: 'Loucura como essa saia\né ✨ PERFEITA ✨\n❤️',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Saia',
      },
    ],
  },
  blusa_camiseta: {
    label: 'Blusas, Batas, Camisetas, Croppeds e Tops',
    items: [
      {
        headline: 'Toda mulher arrasa\ncom uma camiseta dessa\n❤️✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Camiseta',
      },
      {
        headline: 'Surreal como essa\nblusa de renda\né perfeita\n✨',
        hashtags: '#modafeminina #achadinhos',
        flowerSymbol: '',
        sourceProduct: 'Blusa',
      },
    ],
  },
  babydoll_camisola_pijama: {
    label: 'Baby Doll, Camisolas e Pijamas',
    items: [
      {
        headline: 'Marido amou já quero outra cor 🌸',
        hashtags: '#modafeminina #foryou',
        flowerSymbol: '🌸',
        sourceProduct: 'Lingerie / camisola',
      },
      {
        headline: 'Marido amou, já quero outra cor 💗',
        hashtags: '#modafeminina #paravoce',
        flowerSymbol: '💗',
        sourceProduct: 'Lingerie',
      },
      {
        headline: 'A cinturinha e os peitos que esse baby doll dá é surreal 💜',
        hashtags: '#babydoll #modafeminina #achadinhos #tiktokshop',
        flowerSymbol: '💜',
        sourceProduct: 'Baby doll',
      },
      {
        headline: 'Coloca esse baby doll pra deixar ele Loco 😚',
        hashtags: '#foryou #babydoll #modafeminina',
        flowerSymbol: '😚',
        sourceProduct: 'Baby doll',
      },
      {
        headline: 'amo dormir linda assim 🌸',
        hashtags: '#pijamafeminino #fy',
        flowerSymbol: '🌸',
        sourceProduct: 'Pijama',
      },
      {
        headline: 'Esse pijaminha é tão lindo 💛',
        hashtags: '#pijama #modafeminina #achadinhos',
        flowerSymbol: '💛',
        sourceProduct: 'Pijama',
      },
      {
        headline: 'Marido amou, já quero outra cor 😍',
        hashtags: '#modafeminina #paravoce',
        flowerSymbol: '😍',
        sourceProduct: 'Lingerie',
      },
      {
        headline: 'Coloca esse baby doll pra deixar ele Loco 💗',
        hashtags: '#foryou #babydoll #modafeminina',
        flowerSymbol: '💗',
        sourceProduct: 'Baby doll',
      },
      {
        headline: 'Coloca esse baby doll pra deixar ele Loco 💜',
        hashtags: '#babydoll #modafeminina #achadinhos',
        flowerSymbol: '💜',
        sourceProduct: 'Baby doll',
      },
    ],
  },
  lingerie_body: {
    label: 'Bodies, Lingeries e Corsets',
    items: [
      {
        headline: 'Blusinha BBB boa, bonita e barata 💋',
        hashtags: '#blusa #bata #modafeminina #achadinhos #amarelomanteiga',
        flowerSymbol: '💋',
        sourceProduct: 'Blusa / bata / body',
      },
      {
        headline: 'Essa blusa linda está tão barata ❤',
        hashtags: '#blusa #bata #body #amarelomanteiga',
        flowerSymbol: '❤',
        sourceProduct: 'Blusa / bata / body',
      },
      {
        headline: 'Esse body custou menos de $25 😍',
        hashtags: '#blusa #bata #body #modafeminina',
        flowerSymbol: '😍',
        sourceProduct: 'Blusa / bata / body',
      },
      {
        headline: 'Esse body de poliamida 😚',
        hashtags: '#body #modafeminina #tiktokshop',
        flowerSymbol: '😚',
        sourceProduct: 'Body',
      },
      {
        headline: 'O efeito silicone que esse body dá é surreal 💛',
        hashtags: '#body #modafeminina #cropped #outfit',
        flowerSymbol: '💛',
        sourceProduct: 'Body',
      },
      {
        headline: 'Marido amou já quero outra cor 🌸',
        hashtags: '#modafeminina #foryou',
        flowerSymbol: '🌸',
        sourceProduct: 'Lingerie / camisola',
      },
      {
        headline: 'Marido amou, já quero outra cor 💗',
        hashtags: '#modafeminina #paravoce',
        flowerSymbol: '💗',
        sourceProduct: 'Lingerie',
      },
      {
        headline: 'Esse body tá simplesmente perfeito 🤍',
        hashtags: '#body #modafeminina #achadinhos',
        flowerSymbol: '🤍',
        sourceProduct: 'Body',
      },
      {
        headline: 'Esse body tem o caimento perfeito 💙',
        hashtags: '#modafeminina #body #cropped',
        flowerSymbol: '💙',
        sourceProduct: 'Body',
      },
      {
        headline: 'O caimento desse body é surreal ✨',
        hashtags: '#body #cropped #achadinhos',
        flowerSymbol: '✨',
        sourceProduct: 'Body',
      },
      {
        headline: 'Esse body de poliamida 💛',
        hashtags: '#body #modafeminina #tiktokshop',
        flowerSymbol: '💛',
        sourceProduct: 'Body',
      },
      {
        headline: 'Marido amou, já quero outra cor 😍',
        hashtags: '#modafeminina #paravoce',
        flowerSymbol: '😍',
        sourceProduct: 'Lingerie',
      },
      {
        headline: 'Essa blusa linda está tão barata ✿',
        hashtags: '#blusa #bata #body #amarelomanteiga',
        flowerSymbol: '✿',
        sourceProduct: 'Blusa / bata / body',
      },
      {
        headline: 'Esse body custou menos de $25 🌸',
        hashtags: '#blusa #bata #body #modafeminina',
        flowerSymbol: '🌸',
        sourceProduct: 'Blusa / bata / body',
      },
      {
        headline: 'Esse body tem o caimento perfeito ✨',
        hashtags: '#modafeminina #body #cropped',
        flowerSymbol: '✨',
        sourceProduct: 'Body',
      },
    ],
  },
  moda_praia: {
    label: 'Moda Praia (Biquínis, Saídas de Praia e Shorts Saia)',
    items: [
      {
        headline: 'Biquíni de fita com regulagem por menos de 50 reais ✿',
        hashtags: '#fyp #foryou #biquini',
        flowerSymbol: '✿',
        sourceProduct: 'Biquíni',
      },
      {
        headline: 'O tanto que esse biquíni é lindo 🌸',
        hashtags: '#fyp #foryou #modafeminina',
        flowerSymbol: '🌸',
        sourceProduct: 'Biquíni',
      },
      {
        headline: 'Essa você precisa ter: saída de praia por menos de R$30,00 ✿',
        hashtags: '#saidadepraia #saidadepraialuxo #saidadepraiacroche',
        flowerSymbol: '✿',
        sourceProduct: 'Saída de praia',
      },
      {
        headline: 'Saída de praia ❤',
        hashtags: '#saidadepraia #modafeminina #achadinhos',
        flowerSymbol: '❤',
        sourceProduct: 'Saída de praia',
      },
      {
        headline: 'SIM! essa saída de praia diva tá quase de GRAÇA 😍',
        hashtags: '#saidadepraia #saidadepraialuxo #saidadepraiacroche #modapraia #modafeminina',
        flowerSymbol: '😍',
        sourceProduct: 'Saída de praia',
      },
      {
        headline: 'Essa saída de praia é tão linda e está tão barato 💔',
        hashtags: '#saidadepraia #saidadepraialuxo #modapraia',
        flowerSymbol: '💔',
        sourceProduct: 'Saída de praia',
      },
      {
        headline: 'Tô amando essa saída de praia 💔',
        hashtags: '#saidadepraia #saidadepraialuxo #modafeminina',
        flowerSymbol: '💔',
        sourceProduct: 'Saída de praia',
      },
      {
        headline: 'Tô amando usar essa saída de praia shorts saia 🌞',
        hashtags: '#saidadepraia #shortsaia #modafeminina #achadinhos',
        flowerSymbol: '🌞',
        sourceProduct: 'Short saia / saída de praia',
      },
      {
        headline: 'O tanto que esse biquíni é lindo 🖤',
        hashtags: '#fyp #foryou #biquini',
        flowerSymbol: '🖤',
        sourceProduct: 'Biquíni',
      },
      {
        headline: 'SIM! essa saída de praia diva tá quase de GRAÇA 💋',
        hashtags: '#saidadepraia #saidadepraialuxo #saidadepraiacroche #modapraia #modafeminina',
        flowerSymbol: '💋',
        sourceProduct: 'Saída de praia',
      },
      {
        headline: 'Essa saída de praia é tão linda e está tão barato 💔',
        hashtags: '#saidadepraia #modafeminina #achadinhos',
        flowerSymbol: '💔',
        sourceProduct: 'Saída de praia',
      },
      {
        headline: 'Tô amando essa saída de praia 💔',
        hashtags: '#saidadepraia #saidadepraialuxo #saidadepraiacroche',
        flowerSymbol: '💔',
        sourceProduct: 'Saída de praia',
      },
    ],
  },
  cinta_modeladora: {
    label: 'Cintas Modeladoras e Corsets',
    items: [
      {
        headline: 'Essa cinta deixa a cintura PP de verdade ✿',
        hashtags: '#cinta #cintamodeladora #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Cinta modeladora',
      },
      {
        headline: 'Essa cinta perfeita está tão barata ✨🖤',
        hashtags: '#cinta #cintamodeladora #achadinhos',
        flowerSymbol: '🖤',
        sourceProduct: 'Cinta modeladora',
      },
      {
        headline: 'Essa cinta perfeita está tão barata ❤',
        hashtags: '#cinta #cintamodeladora #modafeminina #achadinhos',
        flowerSymbol: '❤',
        sourceProduct: 'Cinta modeladora',
      },
    ],
  },
  jaqueta_casaco: {
    label: 'Jaquetas, Corta-Ventos e Casacos Motoqueira',
    items: [
      {
        headline: 'Jaqueta corta vento estilo motoqueira 🤎',
        hashtags: '#moto #apinestars #modafeminina #achadinhos #fyp',
        flowerSymbol: '🤎',
        sourceProduct: 'Jaqueta corta-vento',
      },
      {
        headline: 'Jaquetinha corta vento estilo motoqueira ✨😍',
        hashtags: '#moto #apinestars #modafeminina',
        flowerSymbol: '😍',
        sourceProduct: 'Jaqueta corta-vento',
      },
      {
        headline: 'Jaqueta corta vento estilo motoqueira 😚',
        hashtags: '#moto #apinestars #modafeminina #achadinhos #fyp',
        flowerSymbol: '😚',
        sourceProduct: 'Jaqueta corta-vento',
      },
    ],
  },
};

/**
 * Mapeamento legado para compatibilidade com o resto do código
 */
export const ANA_MARIA_BANK: AnaMariaBankEntry[] = [
  {
    id: 'macacao_fitness',
    product: 'Macacão Fitness Feminino',
    headline: 'Esse macacão flare perfeito tá dando o que falar ❀',
    hashtags: '#fyp #foryou #gym',
    keywords: ['macacao fitness', 'macacão fitness', 'flare', 'fitness', 'treino', 'academia', 'legging', 'gym'],
    flowerSymbol: '❀',
    category: 'fitness',
  },
  {
    id: 'cinta_modeladora',
    product: 'Cinta Modeladora Abdominal',
    headline: 'o real culpado de deixar minha cintura PP ❀',
    hashtags: '#cintamodeladora #cinta #modeladora #mulher',
    keywords: ['cinta', 'modeladora', 'abdominal', 'cintura', 'corset', 'corpete', 'afinadora'],
    flowerSymbol: '❀',
    category: 'cinta',
  },
  {
    id: 'vestido_longo_renda',
    product: 'Vestido Longo Preto com Detalhes em Renda para Ocasiões Especiais',
    headline: 'o vestido que toda garota deveria ter ❀',
    hashtags: '#conjunto #fy #foryou',
    keywords: ['vestido longo', 'renda', 'preto', 'vestido festa', 'ocasioes especiais', 'vestido preto'],
    flowerSymbol: '❀',
    category: 'vestido',
  },
  {
    id: 'vestido_decote_barato',
    product: 'Vestido Feminino Longo Com Decote',
    headline: 'Logo hj que não tenho R$13 ❀',
    hashtags: '#vestido #modafeminina #fyp #foryou',
    keywords: ['vestido decote', 'decote', 'vestido longo com decote', 'vestido feminino longo'],
    flowerSymbol: '❀',
    category: 'vestido',
  },
  {
    id: 'macaquinho_fitness',
    product: 'Macaquinho Feminino Fitness',
    headline: 'Esse macaquinho está tão barato ❀',
    hashtags: '#fyp #foryou #gym',
    keywords: ['macaquinho fitness', 'macaquinho treino', 'macaquinho academia'],
    flowerSymbol: '❀',
    category: 'fitness',
  },
  {
    id: 'calca_linho',
    product: 'Calça Linho Feminino',
    headline: 'agora sim entendi o motivo dessa calça sempre tá esgotada ❀',
    hashtags: '#calçadelinho #linho #calçafeminina',
    keywords: ['calca linho', 'calça linho', 'calça de linho', 'linho', 'calça feminina', 'calca feminina', 'pantalona'],
    flowerSymbol: '❀',
    category: 'calca',
  },
  {
    id: 'macaquinho_alfaiataria',
    product: 'Macaquinho Feminino Alfaiataria',
    headline: 'O macacão que ganhou meu coração todinho ❀',
    hashtags: '#itgirl #outfit #fyp #foryou',
    keywords: ['macaquinho alfaiataria', 'macacao alfaiataria', 'alfaiataria', 'elegante', 'macacão social'],
    flowerSymbol: '❀',
    category: 'macaquinho',
  },
  {
    id: 'macaquinho_anarruga',
    product: 'Macaquinho Anarruga',
    headline: 'Esse Macaquinho Lindo Está muito Barato ❀',
    hashtags: '#lookfitness #moda #macaquinhofitness',
    keywords: ['anarruga', 'macaquinho anarruga', 'macacao anarruga', 'tecido anarruga'],
    flowerSymbol: '❀',
    category: 'macaquinho',
  },
  {
    id: 'vestido_curto_elegante',
    product: 'Vestido Curto Feminino Frente Única Elegante',
    headline: 'Esse vestido lindo está tão barato ❀',
    hashtags: '#itgirl #fyp #foryou',
    keywords: ['vestido curto', 'frente unica', 'frente única', 'vestido tubinho', 'vestido festa curto'],
    flowerSymbol: '❀',
    category: 'vestido',
  },
  {
    id: 'babydoll_feminino',
    product: 'Baby Doll Feminino',
    headline: 'Coloca esse baby doll pra deixar ele Loco ❀',
    hashtags: '#foryou #babydoll #modafeminina',
    keywords: ['baby doll', 'babydoll', 'camisola', 'pijama sensual', 'lingerie', 'renda sensual'],
    flowerSymbol: '❀',
    category: 'pijama',
  },
  {
    id: 'blusinha_cropped',
    product: 'Blusinha Cropped Babado Amarracao',
    headline: 'Essa blusinha perfeita tá tão baratinha ❀',
    hashtags: '#blusa #fyp #foryou',
    keywords: ['blusinha', 'cropped', 'babado', 'amarracao', 'amarração', 'blusa feminina', 'top'],
    flowerSymbol: '❀',
    category: 'blusa',
  },
  {
    id: 'vestido_perfeicao',
    product: 'vestido longo Femenino',
    headline: 'O vestido que entrega perfeição ✨ ❤️',
    hashtags: '#modafeminina #vestidoelegante #lookfeminino #vestidolongo',
    keywords: ['vestido entrega perfeição', 'vestido longo feminino', 'vestido elegante', 'longo feminino'],
    flowerSymbol: '✨',
    category: 'vestido',
  },
  {
    id: 'vestido_reveillon',
    product: 'Vestido Acetinado com Detalhe de Flor Vibrante para Ocasiões Especiais',
    headline: 'vestido perfeito para fim de ano ✨ 🤍',
    hashtags: '#LookDeFimDeAno #LookDeReveillon #LookReveillon #LookDeAnoNovo #Reveillon2026',
    keywords: ['acetinado', 'flor vibrante', 'fim de ano', 'reveillon', 'ano novo', 'branco', 'festa'],
    flowerSymbol: '✨',
    category: 'vestido',
  },
  {
    id: 'babydoll_petite_plus',
    product: 'Baby Doll Com Decote Nas Costas Conforto Pijama Modelo Petite e Plus Size',
    headline: 'amo dormir linda assim 🌸',
    hashtags: '#pijamafeminino #fy #vaiprofycaramba',
    keywords: ['decote nas costas', 'pijama', 'dormir', 'conforto', 'petite', 'plus size pijama', 'camisola dormir'],
    flowerSymbol: '🌸',
    category: 'pijama',
  },
];

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta a categoria do produto a partir de seu nome e instruções.
 */
export function detectProductCategory(text: string): ProductCategoryGroup {
  const norm = normalizeText(text);

  // 1. Moda Praia (tem prioridade sobre saia porque saída de praia contém saia)
  if (/\b(biquini|biquinis|maio|maios|saida de praia|saidas de praia|praia)\b/.test(norm)) {
    return 'moda_praia';
  }
  // 2. Cinta Modeladora
  if (/\b(cinta|cintura pp|modeladora|corset|corpete|afinadora)\b/.test(norm)) {
    return 'cinta_modeladora';
  }
  // 3. Baby Doll / Pijama / Camisola
  if (/\b(baby doll|babydoll|camisola|pijama|dormir|sleepwear)\b/.test(norm)) {
    return 'babydoll_camisola_pijama';
  }
  // 4. Lingerie / Body
  if (/\b(body|bodies|lingerie|calcinha|sutia)\b/.test(norm) && !norm.includes('body splash')) {
    return 'lingerie_body';
  }
  // 5. Jaqueta / Casaco
  if (/\b(jaqueta|jaquetinha|corta vento|casaco|blazer|sobretudo|cardigan)\b/.test(norm)) {
    return 'jaqueta_casaco';
  }
  // 6. Bermuda / Shorts
  if (/\b(bermuda|bermudas|short|shorts|shortinho|ciclista)\b/.test(norm)) {
    return 'bermuda_shorts';
  }
  // 7. Saia (não sendo saída de praia)
  if (/\b(saia|saias|minissaia)\b/.test(norm) && !norm.includes('saida de praia')) {
    return 'saia';
  }
  // 8. Macaquinho / Macacão (apenas se não for calça)
  if (
    (/\b(macaquinho|macaquinhos|macacao|macacoes)\b/.test(norm) ||
      (!/\b(calca|calcas)\b/.test(norm) && /\b(flare|pantacourt)\b/.test(norm)))
  ) {
    return 'macaquinho_macacao';
  }
  // 9. Fitness
  if (/\b(fitness|academia|treino|gym|legging|suplex)\b/.test(norm)) {
    return 'conjunto_fitness';
  }
  // 10. Conjunto (se não fitness)
  if (/\b(conjunto|conjuntinho|co ord|duas pecas)\b/.test(norm)) {
    return 'conjunto';
  }
  // 11. Vestido
  if (/\b(vestido|vestidos|vestidinho|tubinho|chemise)\b/.test(norm)) {
    return 'vestido';
  }
  // 12. Calça (ignora menção solta de tecido "linho/jeans/alfaiataria" quando o produto é camisa/camiseta/blusa)
  const hasExplicitUpper = /\b(blusa|blusinha|cropped|camisa|camisas|camiseta|camisetas|polo|top|t shirt|tshirt|regata|sueter|sweater)\b/.test(norm);
  if (
    /\b(calca|calcas|pantalona|wide leg|pantacourt|legging)\b/.test(norm) ||
    (!hasExplicitUpper && /\b(linho|jeans|alfaiataria)\b/.test(norm))
  ) {
    return 'calca';
  }
  // 13. Blusa / Cropped / Camisa / Camiseta
  if (hasExplicitUpper) {
    return 'blusa_camiseta';
  }

  return 'outro';
}

function stripStylingForCategory(rawText?: string): string {
  if (!rawText) return '';
  return rawText
    .split(/\n+/)
    .filter(
      (line) =>
        !/^\s*[\-•*✔✓✅🔹🔸▪️➤►]?\s*(?:use|combine|combinando|combina|aposte|vai\s+bem|fica\s+(?:lindo|perfeito|[oó]timo))\s+com\b/i.test(
          line
        )
    )
    .join(' ')
    .replace(/\b(?:use|combine|combinando|combina)\s+com\s+[^.;|\n]+/gi, ' ');
}

function detectCategoryPrioritizingName(
  productName: string,
  productInfo?: string,
  additionalInstructions?: string
): ProductCategoryGroup {
  const fromName = detectProductCategory(productName);
  if (fromName !== 'outro') {
    return fromName;
  }
  const cleanInfo = stripStylingForCategory(productInfo);
  return detectProductCategory(`${cleanInfo} ${additionalInstructions || ''}`);
}

/**
 * Seleciona e adapta a headline e as hashtags de acordo com o grupo do produto, gênero e tipo de corpo.
 * 
 * REGRA CRÍTICA DO USUÁRIO:
 * 1. O aplicativo agrupa por tipo de peça (vestido, conjunto, calça, bermuda, saia, etc.).
 * 2. Quando o produto for um vestido, SEMPRE seleciona de forma randômica uma headline e hashtags
 *    que pertençam EXCLUSIVAMENTE ao grupo de vestidos desse banco de memória real.
 * 3. NUNCA misturar tags (ex: nunca colocar hashtag de bermuda em vestido).
 * 4. Somente se o produto for totalmente novo e não pertencer a nenhum grupo, o app adapta de forma genérica.
 * 5. A headline sempre deve terminar com a florzinha (✿, ❀, 🌸 ou ✨).
 * 6. As hashtags NUNCA devem incluir o nome do produto no texto de cópia.
 */
function stripEmojisFromAdaptedHeadline(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}❤✨🌸✿❀💋🤍💗💜💛😍😎😲🔥⚡⭐]+/gu, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}

function adaptHeadlineToMale(headline: string, combinedNorm = ''): string {
  const isCamisaOnly =
    /\bcamisa(s)?\b/i.test(combinedNorm) && !/\b(camiseta|camisetas|t-shirt|tshirt)\b/i.test(combinedNorm);
  const isTrico = /\b(trico|tricot)\b/i.test(combinedNorm);
  const maleTopWord = isCamisaOnly
    ? isTrico
      ? 'camisa de tricô'
      : 'camisa'
    : 'camiseta';

  const adapted = headline
    .replace(/\btoda\s+garota\b/gi, (m) => (m[0] === 'T' ? 'Todo homem' : 'todo homem'))
    .replace(/\btoda\s+mulher\b/gi, (m) => (m[0] === 'T' ? 'Todo homem' : 'todo homem'))
    .replace(/\bgarotas\b/gi, (m) => (m[0] === 'G' ? 'Homens' : 'homens'))
    .replace(/\bmeninas\b/gi, (m) => (m[0] === 'M' ? 'Rapazes' : 'rapazes'))
    .replace(/\bmulheres\b/gi, (m) => (m[0] === 'M' ? 'Homens' : 'homens'))
    .replace(/\bblusas?\s+de\s+renda\b/gi, maleTopWord)
    .replace(/\bblusas?\s+rendad[oa]s?\b/gi, maleTopWord)
    .replace(/\bblusinhas?\b/gi, maleTopWord)
    .replace(/\bblusas?\b/gi, maleTopWord)
    .replace(/\bcamisetas?\b/gi, (m) => (isCamisaOnly ? maleTopWord : m))
    .replace(/\bestilosa\b/gi, 'estiloso')
    .replace(/\bmaravilhosa\b/gi, 'incrível')
    .replace(/\bpoderosa\b/gi, 'imponente')
    .replace(/\blinda\b/gi, 'lindo')
    .replace(/\bvestida\b/gi, 'vestido');

  // Ao adaptar uma headline feminina para uso masculino, remove emojis/símbolos decorativos
  return stripEmojisFromAdaptedHeadline(adapted);
}

function resolveMaleSpecificHeadline(combinedNorm: string): string | null {
  const isConjunto = /\b(conjunto|conjuntinho|conjuntos)\b/i.test(combinedNorm);
  const isKit3Conjuntos =
    /\b(?:kit|combo|pack)\b[^.\n]{0,25}\b(?:3|tres)\s+conjunt/i.test(combinedNorm) ||
    /\b(?:3|tres)\s+conjunt/i.test(combinedNorm);
  const isKit2Conjuntos =
    /\b(?:kit|combo|pack)\b[^.\n]{0,25}\b(?:2|dois)\s+conjunt/i.test(combinedNorm) ||
    /\b(?:2|dois)\s+conjunt/i.test(combinedNorm);
  const isKit2Camisas =
    /\b(?:kit|combo|pack)\b[^.\n]{0,25}\b(?:2|duas|dois)\s+(?:camisa|camisas|camiseta|camisetas|t-shirt|tshirt)\b/i.test(
      combinedNorm
    ) ||
    /\b(?:2|duas)\s+(?:camisa|camisas|camiseta|camisetas|t-shirt|tshirt)\b/i.test(combinedNorm);

  if (isConjunto) {
    if (isKit3Conjuntos) {
      return 'KIT COM\n3 CONJUNTOS\nESTÁ TÃO\nBARATO\n😎';
    }
    if (!isKit2Conjuntos) {
      return 'esse\nconjunto\nvale\ncada\ncentavo\n😎';
    }
  }

  if (isKit2Camisas) {
    return 'COMO ASSIM\n2 CAMISAS\nPELO\nPREÇO DE 1 😲';
  }

  return null;
}

function resolveMaleHashtags(combinedNorm: string): string {
  if (/\b(conjunto|conjuntinho|conjuntos)\b/i.test(combinedNorm)) {
    return '#modamasculina #conjuntomasculino #fypシ';
  }
  if (/\b(camisa|camisas|camiseta|camisetas|polo|regata|t-shirt|tshirt)\b/i.test(combinedNorm)) {
    return '#modamasculina #camisamasculina #fypシ';
  }
  if (/\bcalca\b/i.test(combinedNorm)) {
    return '#modamasculina #camisamasculina #fypシ';
  }
  return '#modamasculina #achadinhos #fypシ';
}

export function resolveHeadlineAndHashtags(params: {
  productName: string;
  productInfo?: string;
  influencer?: AnaMariaInfluencer;
  bodyType?: AnaMariaBodyType;
  additionalInstructions?: string;
  excludeHeadline?: string;
  excludeHashtags?: string;
}): {
  headline: string;
  hashtags: string;
  matchedEntry?: AnaMariaBankEntry;
  detectedCategory?: ProductCategoryGroup;
} {
  const normName = normalizeText(params.productName);
  const normInfo = normalizeText(stripStylingForCategory(params.productInfo));
  const normExtra = normalizeText(params.additionalInstructions || '');
  const combined = `${normName} ${normInfo} ${normExtra}`.trim();

  const category = detectCategoryPrioritizingName(
    params.productName,
    params.productInfo,
    params.additionalInstructions
  );

  let chosenHeadline = '';
  let flower = '❀';

  if (category !== 'outro' && PRODUCT_HEADLINES_GROUPED[category]) {
    const group = PRODUCT_HEADLINES_GROUPED[category];
    const items = group.items;

    // Filtra para nunca repetir a headline atual caso haja outras disponíveis no banco de memória
    let pool = items;
    if (params.excludeHeadline && items.length > 1) {
      const cleanExclude = params.excludeHeadline.trim().toLowerCase();
      const filtered = items.filter(
        (it) => it.headline.trim().toLowerCase() !== cleanExclude
      );
      if (filtered.length > 0) {
        pool = filtered;
      }
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];

    chosenHeadline = chosen.headline;
    flower = chosen.flowerSymbol ?? '';
  } else {
    // Produto não cadastrado em nenhuma das categorias conhecidas (ex: bolsas, sapatos, acessórios)
    const genericHeadlines = [
      'Esse achadinho lindo está tão barato ✨',
      'O caimento e estilo desse produto é surreal ✨🤍',
      'Sem acreditar na perfeição disso e no quanto tá custando ✿',
      'Aquele achadinho que toda garota deveria ter ❀',
      'Simplesmente encontrei a melhor escolha por esse valor 🌸',
    ];
    let pool = genericHeadlines;
    if (params.excludeHeadline && genericHeadlines.length > 1) {
      const cleanExclude = params.excludeHeadline.trim().toLowerCase();
      const filtered = genericHeadlines.filter((h) => h.trim().toLowerCase() !== cleanExclude);
      if (filtered.length > 0) pool = filtered;
    }
    chosenHeadline = pool[Math.floor(Math.random() * pool.length)];
    flower = '✨';
  }

  // Garante o símbolo floral apenas para itens legados que definem flowerSymbol e não possuem emoji
  let finalHeadline = appendLegacyFlowerIfNeeded(chosenHeadline, flower);
  let tagsOnly = '#modafeminina #achadinhos';

  if (params.influencer === 'Homem') {
    const maleSpecific = resolveMaleSpecificHeadline(combined);
    finalHeadline = maleSpecific || adaptHeadlineToMale(finalHeadline, combined);
    tagsOnly = resolveMaleHashtags(combined);
  }

  // Busca uma entrada correspondente no banco legado para manter retrocompatibilidade
  const matchedEntry = ANA_MARIA_BANK.find((e) => e.category === category) || ANA_MARIA_BANK[0];

  return {
    headline: finalHeadline.trim(),
    hashtags: tagsOnly.trim(),
    matchedEntry,
    detectedCategory: category,
  };
}

/**
 * Anexa símbolo floral apenas para itens legados que definem `flowerSymbol` não vazio e não possuem emoji.
 */
function appendLegacyFlowerIfNeeded(text: string, flower = ''): string {
  const cleaned = text.trim();
  if (!flower) return cleaned;
  const hasAnyEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}❤✨🌸✿❀💋]/u.test(cleaned);
  return hasAnyEmoji ? cleaned : `${cleaned} ${flower}`.trim();
}

/**
 * Retorna até `count` headlines diferentes (sem repetir iguais) do banco de memória para o produto.
 * Se a categoria tiver menos que `count` headlines únicas na memória, retorna apenas as diferentes que possui.
 */
export function resolveMultipleDistinctHeadlines(params: {
  productName: string;
  productInfo?: string;
  influencer?: AnaMariaInfluencer;
  additionalInstructions?: string;
  count: number;
  excludeHeadlines?: string[];
}): string[] {
  const normName = normalizeText(params.productName);
  const normInfo = normalizeText(stripStylingForCategory(params.productInfo));
  const normExtra = normalizeText(params.additionalInstructions || '');
  const combined = `${normName} ${normInfo} ${normExtra}`.trim();
  const category = detectCategoryPrioritizingName(
    params.productName,
    params.productInfo,
    params.additionalInstructions
  );
  const targetCount = Math.max(1, params.count || 1);

  if (params.influencer === 'Homem') {
    const maleSpecific = resolveMaleSpecificHeadline(combined);
    if (maleSpecific) {
      return [maleSpecific];
    }
  }

  let rawCandidates: string[] = [];
  if (category !== 'outro' && PRODUCT_HEADLINES_GROUPED[category]) {
    rawCandidates = PRODUCT_HEADLINES_GROUPED[category].items.map((it) =>
      appendLegacyFlowerIfNeeded(it.headline, it.flowerSymbol ?? '')
    );
  } else {
    rawCandidates = [
      'Esse achadinho lindo está tão barato ✨',
      'O caimento e estilo desse produto é surreal ✨🤍',
      'Sem acreditar na perfeição disso e no quanto tá custando ✿',
      'Aquele achadinho que toda garota deveria ter ❀',
      'Simplesmente encontrei a melhor escolha por esse valor 🌸',
    ];
  }

  if (params.influencer === 'Homem') {
    rawCandidates = rawCandidates.map((h) => adaptHeadlineToMale(h, combined));
  }

  // Deduplica mantendo apenas headlines únicas (case-insensitive)
  const seen = new Set<string>();
  const uniquePool: string[] = [];
  for (const h of rawCandidates) {
    const key = h.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      uniquePool.push(h.trim());
    }
  }

  const excludedSet = new Set(
    (params.excludeHeadlines || []).map((h) => h.trim().toLowerCase()).filter(Boolean)
  );
  const preferred = uniquePool.filter((h) => !excludedSet.has(h.toLowerCase()));
  const fallback = uniquePool.filter((h) => excludedSet.has(h.toLowerCase()));

  // Embaralha aleatoriamente (Fisher-Yates)
  const shuffle = (arr: string[]): string[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const ordered = [...shuffle(preferred), ...shuffle(fallback)];
  return ordered.slice(0, Math.min(targetCount, uniquePool.length));
}
