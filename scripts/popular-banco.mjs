// Cadastra os pontos FICTÍCIOS de scripts/pontos-ficticios.json no Firestore.
//
// Uso (na raiz do projeto):  npm run popular-banco
// O script pede o e-mail e a senha de um parceiro de teste (criado no
// Console do Firebase > Authentication). A senha não aparece na tela e não
// é gravada em lugar nenhum. As regras do Firestore valem normalmente: o
// script grava como esse parceiro, igual ao app.
//
// Pode rodar mais de uma vez: pontos que o parceiro já tem com o mesmo nome
// são pulados.

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  setDoc,
  terminate,
} from 'firebase/firestore';

process.loadEnvFile('.env');

const configuracao = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const { parceiro, pontos } = JSON.parse(
  readFileSync(new URL('./pontos-ficticios.json', import.meta.url), 'utf8')
);

// Pergunta no terminal; com oculto = true, não mostra o que é digitado.
function perguntar(texto, oculto = false) {
  return new Promise((resolver) => {
    const leitor = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      leitor._writeToOutput = (saida) => {
        if (saida.includes(texto)) {
          process.stdout.write(saida);
        }
      };
    }
    leitor.question(texto, (resposta) => {
      leitor.close();
      if (oculto) {
        process.stdout.write('\n');
      }
      resolver(resposta.trim());
    });
  });
}

async function principal() {
  const app = initializeApp(configuracao);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = await perguntar('E-mail do parceiro de teste: ');
  const senha = await perguntar('Senha: ', true);
  const { user } = await signInWithEmailAndPassword(auth, email, senha);
  console.log(`Entrou como ${user.email}.`);

  await setDoc(doc(db, 'parceiros', user.uid), parceiro);
  console.log('Cadastro do parceiro gravado em parceiros/{uid}.');

  const colecao = collection(db, 'pontos');
  const existentes = await getDocs(query(colecao, where('parceiroId', '==', user.uid)));
  const nomesExistentes = new Set(existentes.docs.map((d) => d.data().nome));

  let criados = 0;
  for (const { situacaoFinal, ...dados } of pontos) {
    if (nomesExistentes.has(dados.nome)) {
      console.log(`- já existe, pulando: ${dados.nome}`);
      continue;
    }
    // Todo ponto nasce ativo (regra do banco). O de teste "desativado" é
    // inativado logo depois, para testar a RN01.
    const referencia = await addDoc(colecao, { ...dados, situacao: 'ativo', parceiroId: user.uid });
    if (situacaoFinal === 'inativo') {
      await updateDoc(referencia, { situacao: 'inativo' });
    }
    criados += 1;
    console.log(`+ criado: ${dados.nome}${situacaoFinal === 'inativo' ? ' (inativo)' : ''}`);
  }

  console.log(`Pronto: ${criados} ponto(s) criado(s).`);
  await signOut(auth);
  await terminate(db);
}

principal().catch((erro) => {
  console.error(`Erro: ${erro.code ?? ''} ${erro.message}`);
  process.exit(1);
});
