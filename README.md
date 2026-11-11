# Eco Ponto

Aplicativo móvel que ajuda a encontrar o ponto de coleta de reciclagem mais próximo.

Projeto da disciplina **CCP150 – Desenvolvimento de Aplicativos Móveis**, feito em conjunto com a disciplina de **Engenharia de Software** (CCG110 – Documento Integrado), 2º semestre de 2026.

> **Status:** funcional. Todas as funcionalidades planejadas estão implementadas e testadas (Jest e React Native Testing Library), e o app já roda no celular pelo Expo Go com pontos de coleta de exemplo no banco. Faltam a demonstração em vídeo ou GIF e o teste com leitor de tela (TalkBack e VoiceOver).

**Equipe**

- Ariel Mauricio Morais Nogueira
- Eduardo Modolo Antunes
- Kaique Leandro Pinheiro de Souza
- Miguel Maia Torres

---

## 1. Visão Geral e Requisitos

**Problema.** Muitas pessoas não sabem onde descartar corretamente papel, plástico, vidro, metal e eletrônicos. A informação sobre os pontos de coleta é espalhada e difícil de achar, o que leva ao descarte incorreto.

**Motivação.** Reunir os pontos de coleta num só lugar e mostrar o mais próximo de forma rápida e simples, incentivando o descarte correto.

**Objetivo.** Permitir que qualquer pessoa encontre um ponto de coleta por Estado e cidade, pela localização do GPS ou por um endereço, e veja detalhes e rota até ele. Órgãos e parceiros ambientais cadastram e mantêm os seus pontos.

**Requisitos do app** (levantados na disciplina de Engenharia de Software):

| ID | Requisito |
|---|---|
| RF01 | Selecionar Estado e cidade para ver os pontos cadastrados |
| RF02 | Obter a localização pelo GPS e calcular o ponto mais próximo |
| RF03 | Pesquisar um endereço para localizar o ponto mais próximo |
| RF04 | Listar os pontos da cidade selecionada |
| RF05 | Exibir os detalhes do ponto (endereço, horário, materiais, distância) |
| RF06 | Parceiros cadastrarem novos pontos |
| RF07 | Exibir em mapa a rota até o ponto |
| RF08 | Filtrar pontos por tipo de material |
| RF09 | Parceiros editarem os seus pontos *(novo)* |
| RF10 | Parceiros excluírem os seus pontos *(novo)* |

Requisitos não funcionais principais: a localização do usuário **nunca é armazenada** (LGPD), o ponto mais próximo aparece em até 3 segundos e só parceiros autenticados alteram pontos.

> **Compatibilidade.** O documento de Engenharia de Software prevê Android 9+ e iOS 14+. O Expo SDK 58 exige **iOS 16.4+** (e Android 7+). Esse requisito será ajustado no documento.

## 2. Tecnologias Utilizadas

| Tecnologia | Uso | Situação |
|---|---|---|
| React Native + Expo (SDK 58) | Base do aplicativo, em JavaScript | Em uso |
| React Navigation | Navegação entre as telas (abas e pilhas) | Em uso |
| Firebase (Authentication e Firestore) | Login dos parceiros e banco de dados com CRUD | Em uso |
| expo-location | Leitura do GPS (sensor do aparelho) | Em uso |
| OpenStreetMap (Nominatim e OSRM) | Busca de endereço e cálculo da rota | Em uso |
| react-native-maps | Mapa da rota (mapa nativo: Google Maps no Android, Apple Maps no iPhone) | Em uso |
| Imagens (componente Image) | Logo do app e ícones dos materiais, gerados por `scripts/gerar-imagens.mjs` | Em uso |
| Vibração (React Native) | Retorno tátil ao usuário (atuador): uma vibração no sucesso, duas no erro | Em uso |
| Jest e React Native Testing Library | Testes automatizados do domínio, dos controladores, dos serviços e das telas | Em uso |

## 3. Funcionalidades

Todas as funcionalidades planejadas estão implementadas:

- [x] **Consulta por região:** os Estados com pontos aparecem na tela inicial e, ao tocar, a tela seguinte mostra as cidades (RF01). Estado, cidade e ponto em até 3 toques (RNF01).
- [x] **Lista de pontos da cidade:** nome, endereço e materiais dos pontos ativos, com aviso quando a cidade não tem pontos (RF04)
- [x] **Ponto mais próximo por GPS ou por endereço:** na tela inicial, com a distância em km; permissão negada mostra aviso e oferece as outras buscas; endereço ambíguo mostra sugestões (RF02, RF03)
- [x] **Detalhes do ponto:** endereço, horários, materiais, telefone, "aberto agora" ou "fechado" e a distância quando há posição de referência (RF05)
- [x] **Rota no mapa:** trajeto calculado pelo OSRM e desenhado no mapa nativo do celular, com distância e tempo, botão para abrir o app de navegação e aviso quando não há internet (RF07)
- [x] **Filtro por material:** com vários materiais, só os pontos que aceitam todos; sem resultado, oferece limpar o filtro (RF08)
- [x] **Login do parceiro:** e-mail e senha pelo Firebase Authentication, com mensagens de erro em português; o parceiro continua logado ao reabrir o app e pode sair (RN04)
- [x] **Meus pontos:** lista os pontos do parceiro (ativos e inativos), edita e exclui com confirmação (RF09, RF10)
- [x] **Cadastro de ponto:** formulário com endereço, materiais e horários; o endereço vira coordenadas pelo Nominatim e os erros aparecem em cada campo (RF06, RN02, RN03, RN05)

## 4. Demonstração

*Em preparação: GIF ou vídeo curto do app funcionando no celular, com capturas de tela da busca, dos detalhes, da rota e da área do parceiro.*

## 5. Instalação e Execução

**Requisitos:** [Node.js](https://nodejs.org) (versão LTS), npm e o aplicativo **Expo Go** no celular (Android ou iOS).

```bash
git clone <url-do-repositorio>
cd eco-ponto-app
npm install
npx expo start
```

**Configuração do Firebase.** O app precisa de um arquivo `.env` na raiz com a configuração do Firebase. Copie o `.env.example` para `.env` e preencha os valores (peça ao grupo ou copie do Console do Firebase, em Configurações do projeto > Seus apps). O `.env` não vai para o GitHub.

As regras de segurança do banco ficam em `firestore.rules` e são publicadas com o Firebase CLI:

```bash
npx firebase-tools@latest deploy --only firestore
```

**Pontos de exemplo.** O banco do projeto já tem os 10 pontos fictícios de `scripts/pontos-ficticios.json` (todos chamados "Ecoponto Teste ...", um deles inativo), ligados a um dono fictício (`parceiro-exemplo`) e por isso não editáveis pelo app. Para cadastrar os mesmos pontos em nome de um parceiro, crie o parceiro no Console do Firebase (Authentication > Usuários) e rode o comando abaixo, que pede o e-mail e a senha dele (a senha não é mostrada nem gravada).

```bash
npm run popular-banco
```

**Abrir no celular.** Abra o **Expo Go** e leia o QR code que aparece no terminal. Dicas que resolveram os problemas do grupo:

- Celular e computador precisam estar na mesma rede. Redes da faculdade (FEINET) bloqueiam a conexão entre aparelhos: use o hotspot do celular.
- No Windows, deixe a rede do hotspot como **privada** e permita o **Node.js** nas redes privadas do Firewall do Windows; sem isso o Expo Go mostra "could not connect to the server".
- No iPhone, o Expo Go do SDK 58 exige login: entre com a mesma conta Expo no celular e no computador (`npx expo login`). Se o terminal falhar ao abrir o navegador, rode `$env:BROWSER = 'none'; npx expo login` e abra o link à mão.
- Se o QR code aparecer distorcido no terminal do editor, rode `npx expo start` numa janela comum do PowerShell.
- Ao trocar de rede, pare e inicie o `npx expo start` de novo, porque o QR code guarda o endereço da rede.

Para rodar os testes automatizados:

```bash
npm test                # executa os testes
npm run test:coverage   # executa os testes e gera o relatório de cobertura
```

## 6. Aprendizados e Próximos Passos

**Estrutura do projeto**

```
App.js            ponto de entrada do app
src/
  navegacao/      abas e pilhas de telas
  telas/          fronteiras (uma por tela)
  componentes/    componentes visuais reutilizados
  controladores/  casos de uso e regras de negócio
  dominio/        entidades, cálculo de distância (Haversine) e regras
  servicos/       Firebase, GPS e mapas
  tema/           cores e espaçamentos
```

A organização segue os documentos de Engenharia de Software (diagrama de classes e arquitetura): as telas só mostram dados, os controladores aplicam as regras e os serviços falam com o que é externo ao app.

**Aprendizados**

- Separar telas, controladores, domínio e serviços permitiu testar todas as regras sem Firebase nem internet, com serviços fictícios.
- As regras de segurança do Firestore garantem no próprio banco que só o parceiro dono altera os seus pontos, mesmo que alguém tente escrever fora do app.
- Serviços gratuitos têm regras de uso: o Nominatim e o OSRM aceitam no máximo 1 pedido por segundo e pedem a identificação do app, e os tiles gratuitos do OpenStreetMap não funcionam no Android com o react-native-maps, por isso o mapa usa o mapa nativo do celular.
- A localização do usuário só existe em memória durante a busca e nunca é gravada (LGPD).

**Próximos passos**

1. Gravar a demonstração (GIF ou vídeo) e adicionar à seção 4.
2. Testar a acessibilidade com TalkBack (Android) e VoiceOver (iPhone), caso de teste CT19.
3. Ajustar o documento de Engenharia de Software às decisões tomadas durante o desenvolvimento (iOS 16.4+, Estados na tela inicial, mapa nativo e métodos novos do diagrama de classes).
4. Para publicar nas lojas: gerar o app com o EAS Build e configurar a chave do Google Maps no Android.

## Uso de inteligência artificial

Conforme permitido no enunciado da disciplina, o grupo usou o **Claude Code** (Anthropic) como apoio no desenvolvimento. A ferramenta foi usada para:

- configurar o projeto Expo, o Jest, o Firebase (banco, regras de segurança e app Web) e as bibliotecas, sempre a partir da documentação oficial do Expo SDK 58;
- escrever o código do domínio, dos controladores, dos serviços (Firebase, GPS, Nominatim, OSRM e vibração), dos componentes e das telas, junto com os testes automatizados;
- gerar as imagens do app com o script `scripts/gerar-imagens.mjs` e gravar os pontos fictícios de exemplo no banco;
- redigir e manter este README.

As decisões de projeto foram do grupo: a arquitetura e os requisitos vêm dos documentos de Engenharia de Software, e escolhas como mostrar os Estados na tela inicial (RNF01) e usar o mapa nativo no lugar dos tiles do OpenStreetMap foram discutidas e aprovadas pela equipe. A equipe revisou, testou no celular e entende todo o código incorporado ao projeto.
