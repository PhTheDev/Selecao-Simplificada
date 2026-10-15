import { University } from "@/api/types/university";

const nomeConselho = "Seleção Simplificada";

const enderecoConselho = "Endereço da instituição";

const emailContato = "contato@example.com";

const telefoneConselho = "(00) 0000-0000";

const localizacaoConselho = "";

const linkPoliticaPrivacidade = "/faq";

const linkPoliticaCookies = "/faq";

const FaceBookConselho = "#";

const InstagramConselho = "#";

const YoutubeConselho = "#";

export {
  emailContato,
  enderecoConselho,
  FaceBookConselho,
  InstagramConselho,
  linkPoliticaCookies,
  linkPoliticaPrivacidade,
  localizacaoConselho,
  nomeConselho,
  telefoneConselho,
  YoutubeConselho,
};

export const UNIVERSITIES: University[] = [
  { name: "Universidade Federal de Exemplo", acronym: "UFE", city: "Cidade Exemplo", state: "SP", type: "public" },
  { name: "Universidade Estadual de Exemplo", acronym: "UEE", city: "Cidade Exemplo", state: "SP", type: "public" },
  { name: "Centro Universitário de Exemplo", acronym: "CUE", city: "Cidade Exemplo", state: "RJ", type: "private" },
];
