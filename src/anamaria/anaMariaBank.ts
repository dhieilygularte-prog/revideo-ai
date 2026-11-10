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
        headline: 'O caimento desse vestido no corpo é surreal ✨🖤🤍',
        hashtags: '#fyp #viral #modafeminina #vestidos #TiktokshopBR1111',
        flowerSymbol: '✨',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Logo hj que não tenho R$13 ✿',
        hashtags: '#vestido #modafeminina #fyp #foryou',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido é tão 💋💋',
        hashtags: '#modafeminina #achadinhos #tiktokshop #look #vestido',
        flowerSymbol: '💋',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Sem acreditar que comprei esse vestido divo por 23,00$ ✿',
        hashtags: '#modafeminina #tiktokshop #vestido #look',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'O vestido que entrega perfeição ✨❤️',
        hashtags: '#modafeminina #vestidodeelegante #lookfeminino #vestidolongo',
        flowerSymbol: '✨',
        sourceProduct: 'Vestido longo',
      },
      {
        headline: 'SIM esse vestido perfeito está praticamente de graça ✿',
        hashtags: '#vestido #modafeminina #fyp #look',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido lindo está tão barato ✨🖤',
        hashtags: '#fyp #foryou #vestido #modafeminina',
        flowerSymbol: '✨',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido lindo está tão barato ✿',
        hashtags: '#vestido #modafeminina #fyp #foryou',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido midi é simplesmente lindo e barato ⋆🌸⋆',
        hashtags: '#modafeminina #vestidomidi #achadinhos #roupasfemininas',
        flowerSymbol: '🌸',
        sourceProduct: 'Vestido midi',
      },
      {
        headline: 'Pov: sem acreditar que comprei esse vestido super baratinho 😍✨',
        hashtags: '#modafeminina #achadinhos #vestido #tiktokshop',
        flowerSymbol: '✨',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Ninguém diz que foi baratinho esse vestido ✨🤍',
        hashtags: '#fyp #foryou #vestido #modafeminina',
        flowerSymbol: '✨',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Eu amei e já quero outras cores ✨',
        hashtags: '#vestido #fyp #foryou #modafeminina',
        flowerSymbol: '✨',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Como assim esse vestido está por esse valor ✿',
        hashtags: '#fyp #foryou #vestido #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Sim, esse vestido perfeito está praticamente de graça ✿',
        hashtags: '#vestido #modafeminina #roupasfemininas #tiktokshop',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Compra o vestido e a autoestima junto 🌸',
        hashtags: '#tiktokshopbr1010 #modafeminina #girls #vestidos #fyp',
        flowerSymbol: '🌸',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Amo comprar depois do hype, tipo olha o preço desse vestido ✿',
        hashtags: '#vestido #modafeminina #look #foryou',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Sim, esse vestido perfeito está literalmente de graça ✿',
        hashtags: '#fyp #foryou #modafeminina #vestido',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido lindo está muito barato ✿',
        hashtags: '#foryou #fyp #looks #vestido #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'O vestido que toda garota deveria ter ❀',
        hashtags: '#modafeminina #vestido #fyp #look',
        flowerSymbol: '❀',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Sem acreditar que esse vestido perfeito está quase de graça ✿',
        hashtags: '#vestido #moda #tiktokshop #looks',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Vestido rosinha 🌸',
        hashtags: '#vestido #modafeminina #look #fyp',
        flowerSymbol: '🌸',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Look junino LINDO garantido sem gastar muito ✿',
        hashtags: '#modafeminina #festajunina #lookjunino #achadinhos #fyp',
        flowerSymbol: '✿',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Simplesmente encontrei o vestido perfeito 💋🖤',
        hashtags: '#vestido #modafeminina #look #fyp',
        flowerSymbol: '💋',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Sem acreditar na perfeição desse vestido e no quanto ele está custando ✨',
        hashtags: '#vestido #look #tiktokshopbr77 #modafeminina',
        flowerSymbol: '✨',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'Esse vestido vale cada centavo ❀',
        hashtags: '#vestido #modafeminina #foryou #fyp',
        flowerSymbol: '❀',
        sourceProduct: 'Vestido',
      },
      {
        headline: 'vestido perfeito para fim de ano ✨ 🤍',
        hashtags: '#LookDeFimDeAno #LookDeReveillon #LookReveillon #LookDeAnoNovo #Reveillon2026',
        flowerSymbol: '✨',
        sourceProduct: 'Vestido Acetinado',
      },
    ],
  },

  conjunto: {
    label: 'Conjuntos Casuais e Sociais',
    items: [
      {
        headline: 'Esse conjuntinho lindo está tão barato 💛',
        hashtags: '#fyp #foryou #modafeminina #conjunto',
        flowerSymbol: '💛',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Esse conjunto está muito barato ✿',
        hashtags: '#fyp #foryou #conjunto #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Na minha opinião, toda garota devia ter um conjuntinho desse ✿',
        hashtags: '#achadinhos #modafeminina #conjunto #foryou',
        flowerSymbol: '✿',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'Na minha opinião toda garota deveria ter um conjunto desse 💛',
        hashtags: '#conjunto #modafeminina #foryou #fyp',
        flowerSymbol: '💛',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'pov: o conjunto já é lindo, e o preço deixou melhor ainda ✿',
        hashtags: '#achadinhos #modafeminina #conjunto #foryou',
        flowerSymbol: '✿',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'A melhor época pra comprar look de ano novo ✨',
        hashtags: '#conjunto #fyt #foryou #looknovo #modafeminina',
        flowerSymbol: '✨',
        sourceProduct: 'Conjunto',
      },
      {
        headline: 'na minha opinião toda garota devia ter um conjuntinho desse ✨💛',
        hashtags: '#conjunto #modafeminina #lookdodia #fyp',
        flowerSymbol: '✨',
        sourceProduct: 'Conjunto',
      },
    ],
  },

  conjunto_fitness: {
    label: 'Moda Fitness e Treino',
    items: [
      {
        headline: 'Esse conjunto lindo está muito barato ✨',
        hashtags: '#fyp #foryou #gym #fitness #treino',
        flowerSymbol: '✨',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'CHOCADA com o caimento Desse conjunto fitness Baratinho ✨😍',
        hashtags: '#gym #conjunto #modafitness #treino',
        flowerSymbol: '✨',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'macaquinho lindo está tão barato 💜',
        hashtags: '#fyp #foryou #gym #macaquinhofitness #fitness',
        flowerSymbol: '💜',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Esse conjuntinho lindo está tão barato ✿',
        hashtags: '#fyp #foryou #conjunto #gym #fitness',
        flowerSymbol: '✿',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Um conjunto fitness que fala mais que mil palavras 😚✨💛',
        hashtags: '#conjunto #fitness #treino #gym #modafitness',
        flowerSymbol: '✨',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'Amo treinar feminina 💗',
        hashtags: '#fy #fyp #fashion #gym #modafitness',
        flowerSymbol: '💗',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'E esse conjuntinho perfeito ✿',
        hashtags: '#fy #gym #modafitness #fitness #treino',
        flowerSymbol: '✿',
        sourceProduct: 'Conjunto fitness',
      },
      {
        headline: 'esse conjunto perfeito tá quase de graça ✿',
        hashtags: '#gym #treino #fyp #foryou #modafitness',
        flowerSymbol: '✿',
        sourceProduct: 'Conjunto fitness',
      },
    ],
  },

  macaquinho_macacao: {
    label: 'Macacões e Macaquinhos',
    items: [
      {
        headline: 'Esse macaquinho lindo está tão barato ✿',
        hashtags: '#fyp #foryou #macaquinho #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Macaquinho',
      },
      {
        headline: 'Esse macaquinho lindo está muito barato ✨🤎',
        hashtags: '#fyp #foryou #macaquinho #modafeminina #look',
        flowerSymbol: '✨',
        sourceProduct: 'Macaquinho',
      },
      {
        headline: 'Esse macacão flare perfeito tá dando o que falar ✿',
        hashtags: '#fyp #foryou #macacao #flare #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Macacão flare',
      },
      {
        headline: 'Esse macaquinho lindo está muito barato ✨💗',
        hashtags: '#fyp #foryou #macaquinho #modafeminina',
        flowerSymbol: '✨',
        sourceProduct: 'Macaquinho',
      },
      {
        headline: 'Esse macaquinho lindo está tão barato ✿',
        hashtags: '#foryou #macaquinho #fyp #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Macaquinho',
      },
      {
        headline: 'Esse macaquinho lindo está dando o que falar ✿',
        hashtags: '#fy #modafitness #roupasdeacademia #fyp #macaquinho',
        flowerSymbol: '✿',
        sourceProduct: 'Macaquinho',
      },
      {
        headline: 'O macacão que ganhou meu coração todinho ❀',
        hashtags: '#itgirl #outfit #fyp #foryou #macacao',
        flowerSymbol: '❀',
        sourceProduct: 'Macacão',
      },
      {
        headline: 'Esse Macaquinho Lindo Está muito Barato ❀',
        hashtags: '#lookfitness #moda #macaquinhofitness #fyp',
        flowerSymbol: '❀',
        sourceProduct: 'Macaquinho',
      },
      {
        headline: 'Esse macaquinho lindo está tão barato ✨',
        hashtags: '#fyp #foryou #macaquinho #modafeminina',
        flowerSymbol: '✨',
        sourceProduct: 'Macaquinho',
      },
    ],
  },

  bermuda_shorts: {
    label: 'Bermudas e Shorts',
    items: [
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
    label: 'Calças (Linho, Jeans, Pantalona, Alfaiataria)',
    items: [
      {
        headline: 'Agora sim entendi o motivo dessa calça sempre tá esgotada ❀',
        hashtags: '#calçadelinho #linho #calçafeminina #modafeminina #fyp',
        flowerSymbol: '❀',
        sourceProduct: 'Calça de linho',
      },
      {
        headline: 'Chocada que essa calça tá quase de graça ✿',
        hashtags: '#calca #modafeminina #looks #fyp #achadinhos',
        flowerSymbol: '✿',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Essa calça pantalona entrega tudo no caimento ✨🖤',
        hashtags: '#calca #pantalona #modafeminina #alfaiataria #lookdodia',
        flowerSymbol: '✨',
        sourceProduct: 'Calça pantalona',
      },
      {
        headline: 'O caimento dessa calça no corpo é surreal ✨🤍',
        hashtags: '#calca #modafeminina #foryou #achadinhos #looks',
        flowerSymbol: '✨',
        sourceProduct: 'Calça',
      },
      {
        headline: 'Sem acreditar no preço dessa calça maravilhosa ✿',
        hashtags: '#calca #looks #modafeminina #tiktokshop #fyp',
        flowerSymbol: '✿',
        sourceProduct: 'Calça',
      },
    ],
  },

  saia: {
    label: 'Saias (Midi, Mini, Longa, Evasê)',
    items: [
      {
        headline: 'Sim, essa saia maravilhosa custa menos de 35$ ✿',
        hashtags: '#modafeminina #saia #achadinhos #roupasfemininas',
        flowerSymbol: '✿',
        sourceProduct: 'Saia',
      },
      {
        headline: 'O caimento dessa saia no corpo é surreal ✨🖤',
        hashtags: '#saia #modafeminina #looks #fyp #achadinhos',
        flowerSymbol: '✨',
        sourceProduct: 'Saia',
      },
      {
        headline: 'Essa saia midi é simplesmente perfeita ✿',
        hashtags: '#saia #saiamidi #modafeminina #look #tiktokshop',
        flowerSymbol: '✿',
        sourceProduct: 'Saia midi',
      },
      {
        headline: 'Sem acreditar que paguei tão barato nessa saia 🌸',
        hashtags: '#saia #achadinhos #modafeminina #foryou #roupasfemininas',
        flowerSymbol: '🌸',
        sourceProduct: 'Saia',
      },
    ],
  },

  blusa_camiseta: {
    label: 'Blusas, Camisetas, Croppeds e Tops',
    items: [
      {
        headline: 'Essa blusinha da Pangeia é simplesmente perfeita ✿',
        hashtags: '#blusa #modafeminina #look #fyp #achadinhos',
        flowerSymbol: '✿',
        sourceProduct: 'Blusinha',
      },
      {
        headline: 'Essa blusinha perfeita tá tão baratinha ✿',
        hashtags: '#blusa #fyp #foryou #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Blusinha',
      },
      {
        headline: 'SEM ACREDITAR na beleza desse CROPPED e o quanto tá custando ✨🤍',
        hashtags: '#modafeminina #cropped #achadinhos #modafitness #look',
        flowerSymbol: '✨',
        sourceProduct: 'Cropped',
      },
      {
        headline: 'Pov: hoje o treino foi No estilo WAKE WAKE ✨',
        hashtags: '#camisa #tiktokshop #ganley #modafeminina',
        flowerSymbol: '✨',
        sourceProduct: 'Camiseta',
      },
      {
        headline: 'Essa blusa entrega elegância pura por esse valor ❀',
        hashtags: '#blusa #modafeminina #lookfeminino #foryou #achadinhos',
        flowerSymbol: '❀',
        sourceProduct: 'Blusa',
      },
      {
        headline: 'Esse cropped é simplesmente surreal no corpo ✿',
        hashtags: '#cropped #modafeminina #look #achadinhos #fyp',
        flowerSymbol: '✿',
        sourceProduct: 'Cropped',
      },
    ],
  },

  babydoll_camisola_pijama: {
    label: 'Baby Doll, Camisolas e Pijamas',
    items: [
      {
        headline: 'Coloca esse baby doll pra deixar ele Loco ❀',
        hashtags: '#foryou #babydoll #modafeminina #lingerie',
        flowerSymbol: '❀',
        sourceProduct: 'Baby doll',
      },
      {
        headline: 'amo dormir linda assim 🌸',
        hashtags: '#pijamafeminino #fy #modafeminina #pijama',
        flowerSymbol: '🌸',
        sourceProduct: 'Pijama',
      },
      {
        headline: 'Esse baby doll de seda tá quase de graça ✿',
        hashtags: '#babydoll #pijama #lingerie #foryou #modafeminina',
        flowerSymbol: '✿',
        sourceProduct: 'Baby doll',
      },
      {
        headline: 'A camisola mais confortável e linda que já tive 🌸',
        hashtags: '#camisola #pijamafeminino #modafeminina #fy #dormirlinda',
        flowerSymbol: '🌸',
        sourceProduct: 'Camisola',
      },
    ],
  },

  lingerie_body: {
    label: 'Bodies e Lingeries',
    items: [
      {
        headline: 'Esse body de poliamida é surreal de perfeito ✨',
        hashtags: '#body #modafeminina #tiktokshop #look',
        flowerSymbol: '✨',
        sourceProduct: 'Body',
      },
      {
        headline: 'Marido amou, já quero outra cor ✿',
        hashtags: '#modafeminina #paravoce #lingerie #look',
        flowerSymbol: '✿',
        sourceProduct: 'Lingerie',
      },
      {
        headline: 'O caimento desse body no corpo valoriza tudo ❀',
        hashtags: '#body #modafeminina #achadinhos #fyp #lookdodia',
        flowerSymbol: '❀',
        sourceProduct: 'Body',
      },
      {
        headline: 'Lingerie delicada e confortável por esse preço 🌸',
        hashtags: '#lingerie #modafeminina #paravoce #foryou #achadinhos',
        flowerSymbol: '🌸',
        sourceProduct: 'Lingerie',
      },
    ],
  },

  moda_praia: {
    label: 'Moda Praia (Biquínis, Saídas de Praia e Maiôs)',
    items: [
      {
        headline: 'O tanto que esse biquíni é lindo 🌸',
        hashtags: '#fyp #foryou #biquini #modapraia',
        flowerSymbol: '🌸',
        sourceProduct: 'Biquíni',
      },
      {
        headline: 'Essa você precisa ter: saída de praia por menos de R$30,00 ✿',
        hashtags: '#saidadepraia #saidadepraialuxo #saidadepraiacroche #modapraia',
        flowerSymbol: '✿',
        sourceProduct: 'Saída de praia',
      },
      {
        headline: 'Biquíni de fita com regulagem por menos de 50 reais ✿',
        hashtags: '#fyp #foryou #biquini #modapraia #verao',
        flowerSymbol: '✿',
        sourceProduct: 'Biquíni',
      },
      {
        headline: 'SIM! essa saída de praia diva tá quase de GRAÇA ✿',
        hashtags: '#biquine #saidadepraia #modapraia #biquinis #maiô',
        flowerSymbol: '✿',
        sourceProduct: 'Saída de praia',
      },
    ],
  },

  cinta_modeladora: {
    label: 'Cintas Modeladoras e Corsets',
    items: [
      {
        headline: 'Essa cinta deixa a cintura PP de verdade ✿',
        hashtags: '#cintamodeladora #gym #modafeminina #cinturafina',
        flowerSymbol: '✿',
        sourceProduct: 'Cinta modeladora',
      },
      {
        headline: 'Essa cinta perfeita está tão barata ✨🖤',
        hashtags: '#cintamodeladora #foryou #gym #cinta',
        flowerSymbol: '✨',
        sourceProduct: 'Cinta modeladora',
      },
      {
        headline: 'o real culpado de deixar minha cintura PP ❀',
        hashtags: '#cintamodeladora #cinta #modeladora #mulher',
        flowerSymbol: '❀',
        sourceProduct: 'Cinta Modeladora Abdominal',
      },
    ],
  },

  jaqueta_casaco: {
    label: 'Jaquetas, Corta-Ventos e Casacos',
    items: [
      {
        headline: 'Jaquetinha corta vento estilo motoqueira ✨😍',
        hashtags: '#moto #modafeminina #jaqueta #look',
        flowerSymbol: '✨',
        sourceProduct: 'Jaqueta corta-vento',
      },
      {
        headline: 'Jaqueta corta vento perfeita tá quase de graça ✿',
        hashtags: '#jaqueta #cortavento #modafeminina #fyp #achadinhos',
        flowerSymbol: '✿',
        sourceProduct: 'Jaqueta corta-vento',
      },
      {
        headline: 'Esse casaco entrega tudo no look de inverno ✨',
        hashtags: '#casaco #jaqueta #modafeminina #lookinverno #achadinhos',
        flowerSymbol: '✨',
        sourceProduct: 'Casaco',
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
  // 8. Macaquinho / Macacão
  if (/\b(macaquinho|macaquinhos|macacao|macacoes|flare|pantacourt)\b/.test(norm)) {
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
  // 12. Calça
  if (/\b(calca|calcas|linho|pantalona|jeans|alfaiataria)\b/.test(norm)) {
    return 'calca';
  }
  // 13. Blusa / Cropped / Camiseta
  if (/\b(blusa|blusinha|cropped|camisa|camiseta|top|t shirt|regata)\b/.test(norm)) {
    return 'blusa_camiseta';
  }

  return 'outro';
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
export function resolveHeadlineAndHashtags(params: {
  productName: string;
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
  const normExtra = normalizeText(params.additionalInstructions || '');
  const combined = `${normName} ${normExtra}`.trim();

  const category = detectProductCategory(combined);

  let chosenHeadline = '';
  let chosenHashtags = '';
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
    chosenHashtags = chosen.hashtags;
    flower = chosen.flowerSymbol || '❀';

    // Se as hashtags do item sorteado forem idênticas às atuais e houver outras hashtags no grupo,
    // seleciona um conjunto alternativo de hashtags de outro item da mesma categoria
    if (params.excludeHashtags && chosenHashtags.trim() === params.excludeHashtags.trim() && items.length > 1) {
      const altItem = items.find((it) => it.hashtags.trim() !== params.excludeHashtags?.trim());
      if (altItem) {
        chosenHashtags = altItem.hashtags;
      }
    }
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
    chosenHashtags = '#fyp #foryou #achadinhos #tiktokshop #produtosvirais';
    flower = '✨';
  }

  // Garantir a presença do símbolo floral no final da headline se ausente
  let finalHeadline = chosenHeadline.trim();
  if (!finalHeadline.includes('❀') && !finalHeadline.includes('✨') && !finalHeadline.includes('🌸') && !finalHeadline.includes('✿') && !finalHeadline.includes('💋') && !finalHeadline.includes('💛') && !finalHeadline.includes('💜') && !finalHeadline.includes('💗')) {
    finalHeadline = `${finalHeadline} ${flower}`;
  }

  // Tratamento de hashtags
  let rawHashtags = (chosenHashtags || '').trim();

  // Ajustes de influenciador masculino vs feminino
  if (params.influencer === 'Homem') {
    rawHashtags = rawHashtags
      .replace(/#modafeminina/gi, '#modamasculina')
      .replace(/#vestidolongomulher/gi, '#modamasculina')
      .replace(/#mulher/gi, '#homem')
      .replace(/#lookfeminino/gi, '#lookmasculino')
      .replace(/#calçafeminina/gi, '#calçamasculina')
      .replace(/#pijamafeminino/gi, '#pijamamasculino')
      .replace(/#roupasfemininas/gi, '#roupasmasculinas');
    if (!rawHashtags.includes('#modamasculina')) {
      rawHashtags = `${rawHashtags} #modamasculina`;
    }
  }

  // Ajuste de Plus Size
  if (params.bodyType === 'plus_size') {
    if (!rawHashtags.includes('#plussize')) {
      rawHashtags = `${rawHashtags} #plussize #modaplussize`;
    }
  }

  // Higieniza para garantir que são apenas hashtags (#tag) separadas por espaço
  // O TikTok aceita e recomenda até 5 hashtags por publicação para máximo alcance
  const tagList = Array.from(new Set(rawHashtags.split(/\s+/).filter((t) => t.startsWith('#'))));

  // Se tiver menos de 5 hashtags e pertencer a uma categoria, completa com outras hashtags reais da mesma categoria até 5
  if (tagList.length < 5 && category !== 'outro' && PRODUCT_HEADLINES_GROUPED[category]) {
    const allCatTags = PRODUCT_HEADLINES_GROUPED[category].items
      .flatMap((it) => it.hashtags.split(/\s+/))
      .filter((t) => t.startsWith('#'));
    for (const extraTag of allCatTags) {
      if (tagList.length >= 5) break;
      if (!tagList.includes(extraTag)) {
        tagList.push(extraTag);
      }
    }
  }

  const tagsOnly = tagList.slice(0, 5).join(' ');

  // Busca uma entrada correspondente no banco legado para manter retrocompatibilidade
  const matchedEntry = ANA_MARIA_BANK.find((e) => e.category === category) || ANA_MARIA_BANK[0];

  return {
    headline: finalHeadline.trim(),
    hashtags: tagsOnly.trim(),
    matchedEntry,
    detectedCategory: category,
  };
}
