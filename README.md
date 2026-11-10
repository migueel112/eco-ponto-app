# Eco Ponto

Aplicativo móvel que ajuda a encontrar o ponto de coleta de reciclagem mais próximo.

Projeto da disciplina **CCP150 – Desenvolvimento de Aplicativos Móveis**, feito em conjunto com a disciplina de **Engenharia de Software** (CCG110 – Documento Integrado), 2º semestre de 2026.

> **Status:** projeto em início. Já existem o projeto Expo, o tema visual, os componentes base (botão, cartão e estrutura de tela) e a navegação em abas e pilhas com as 8 telas ainda vazias, só com texto e botões para a próxima tela. O domínio começou a ser escrito com testes automatizados (Jest): o cálculo de distância por Haversine, a verificação de "aberto agora" pelo horário de funcionamento, a regra de só mostrar pontos ativos, o filtro por materiais, a ordenação da lista, o cálculo do ponto mais próximo, a lista de Estados e as validações do cadastro de ponto já estão prontos, assim como os três controladores: busca, ponto de coleta e cadastro (testados com dados fictícios, ainda sem banco). Ainda não há dados, GPS, mapa nem Firebase. As funcionalidades abaixo estão planejadas e serão marcadas conforme forem implementadas.

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
| Firebase (Authentication e Firestore) | Login dos parceiros e banco de dados com CRUD | Em configuração |
| expo-location | Leitura do GPS (sensor do aparelho) | Planejado |
| OpenStreetMap (mapa, Nominatim e OSRM) | Mapa, busca de endereço e rota | Planejado |
| Vibração (React Native) | Retorno tátil ao usuário (atuador) | Planejado |
| Jest (preset jest-expo) | Testes automatizados do domínio e dos controladores | Em uso |

## 3. Funcionalidades

Nenhuma funcionalidade implementada ainda. Plano de telas:

- [ ] **Consulta por região:** escolher Estado e cidade e ver a lista de pontos (RF01, RF04)
- [ ] **Tela inicial:** buscar o ponto mais próximo por GPS ou por endereço (RF02, RF03)
- [ ] **Detalhes do ponto:** endereço, horário, materiais, distância e rota (RF05, RF07)
- [ ] **Filtro por material** (RF08)
- [ ] **Login do parceiro**
- [ ] **Meus pontos:** listar, editar e excluir (RF09, RF10)
- [ ] **Cadastro de ponto** (RF06)

## 4. Demonstração

*Será adicionada quando houver telas funcionando (GIF ou vídeo curto e capturas de tela).*

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

Abra o **Expo Go** no celular e leia o QR code que aparece no terminal (celular e computador na mesma rede Wi-Fi).

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

**Próximos passos**

1. ~~Implementar o domínio e os controladores com testes~~ (concluído: Haversine, "aberto agora", só pontos ativos, filtro por materiais, ordenação, ponto mais próximo, validações do cadastro e os três controladores, com 100% de cobertura).
2. Criar o projeto no Firebase e implementar o CRUD de pontos.
3. Preencher as telas com dados: Estado e cidade, lista e detalhes.
4. Implementar a busca por GPS e por endereço.
5. Exibir o mapa e a rota.
6. Escolher as imagens (ícones por tipo de material) e refinar a interface.

## Uso de inteligência artificial

Este projeto usa o **Claude Code** (Anthropic) como apoio, conforme permitido no enunciado da disciplina. Até agora a IA foi usada para:

- criar e configurar o projeto Expo inicial;
- propor a estrutura de pastas;
- redigir o rascunho deste README;
- escrever o tema, os componentes base, as telas vazias e a navegação, a partir das decisões do grupo e da documentação oficial do React Navigation;
- configurar o Jest com o preset jest-expo, seguindo a documentação de testes do Expo SDK 58;
- escrever o cálculo de distância por Haversine (`src/dominio/distancia.js`) e os seus testes (caso de teste CT04);
- escrever as regras do horário de funcionamento e o `estaAberto` do ponto de coleta (`src/dominio/horario.js` e `src/dominio/pontoDeColeta.js`), com testes;
- escrever a regra de só listar pontos ativos (RN01) e o filtro por materiais (`src/dominio/materiais.js`, RF08), com testes (CT13);
- escrever a ordenação da lista por distância ou por nome (`src/dominio/ordenacao.js`, RF04) e a Busca com o cálculo do ponto mais próximo e o desempate pelo ponto aberto (`src/dominio/busca.js`, RN06), com testes;
- escrever a lista de Estados (`src/dominio/estados.js`), a normalização de textos (`src/dominio/texto.js`) e as validações do cadastro de ponto (`src/dominio/validacao.js`, RN02, RN03 e RN05), com testes (CT10);
- escrever o controlador da busca (`src/controladores/ControladorBusca.js`), que recebe o banco e o serviço de endereços como parâmetro, com testes usando dados fictícios;
- escrever o controlador do ponto de coleta (`src/controladores/ControladorPontoDeColeta.js`): detalhes, distância e rota, com o aviso de falta de internet, e os seus testes (CT08 e CT12);
- escrever o controlador do cadastro (`src/controladores/ControladorCadastro.js`): login obrigatório, cadastrar, editar e excluir só os próprios pontos, e os seus testes (CT09, CT10, CT11, CT14 e CT15);
- criar o banco Firestore e registrar o app pelo Firebase CLI (o login na conta Google e o aceite dos termos foram feitos pela equipe), escrever e publicar as regras de segurança (`firestore.rules`) e escrever a inicialização do Firebase (`src/servicos/firebase.js`), seguindo a documentação do Expo SDK 58.

A equipe revisa, testa e entende todo código incorporado e atualiza esta seção conforme o uso da IA avança.
