# Eco Ponto

Aplicativo móvel que ajuda a encontrar o ponto de coleta de reciclagem mais próximo.

Projeto da disciplina **CCP150 – Desenvolvimento de Aplicativos Móveis**, feito em conjunto com a disciplina de **Engenharia de Software** (CCG110 – Documento Integrado), 2º semestre de 2026.

> **Status:** projeto em início. Por enquanto existem apenas o projeto Expo configurado e a estrutura de pastas. As funcionalidades abaixo estão planejadas e serão marcadas conforme forem implementadas.

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
| React Navigation | Navegação entre as telas | Planejado |
| Firebase (Authentication e Firestore) | Login dos parceiros e banco de dados com CRUD | Planejado |
| expo-location | Leitura do GPS (sensor do aparelho) | Planejado |
| OpenStreetMap (mapa, Nominatim e OSRM) | Mapa, busca de endereço e rota | Planejado |
| Vibração (React Native) | Retorno tátil ao usuário (atuador) | Planejado |

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

Abra o **Expo Go** no celular e leia o QR code que aparece no terminal (celular e computador na mesma rede Wi-Fi).

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

1. Configurar a navegação e criar as telas.
2. Criar o projeto no Firebase e implementar o CRUD de pontos.
3. Implementar a busca por GPS, o cálculo de distância e a busca por endereço.
4. Exibir o mapa e a rota.
5. Escolher as imagens (ícones por tipo de material) e refinar a interface.

## Uso de inteligência artificial

Este projeto usa o **Claude Code** (Anthropic) como apoio, conforme permitido no enunciado da disciplina. Até agora a IA foi usada para:

- criar e configurar o projeto Expo inicial;
- propor a estrutura de pastas;
- redigir o rascunho deste README.

A equipe revisa, testa e entende todo código incorporado e atualiza esta seção conforme o uso da IA avança.
