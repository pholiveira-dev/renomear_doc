# Renomeador de Documentos de Alunos

Aplicação web simples que permite **renomear automaticamente documentos enviados por alunos** seguindo um padrão institucional.

O usuário seleciona o **nome completo do aluno** e envia os arquivos correspondentes. O sistema então disponibiliza o download dos arquivos já renomeados no formato:

```
NOME COMPLETO - TIPO DO DOCUMENTO.ext
```

Exemplo:

```
PEDRO HENRIQUE DE OLIVEIRA ALVES - CARTÃO DE VACINA.pdf
PEDRO HENRIQUE DE OLIVEIRA ALVES - FOTO 3x4.jpg
```

---

# ✨ Funcionalidades

* Interface simples e intuitiva
* Upload de múltiplos documentos
* Campos independentes para cada tipo de documento
* Renomeação automática
* Download individual de cada arquivo renomeado
* Nenhum dado é enviado para servidor (processamento ocorre no navegador)

---

# 📄 Tipos de documentos suportados

A aplicação possui campos específicos para os seguintes documentos:

* TCE FEPECS
* CADASTRO SEI
* TCE IGES
* FOTO 3x4
* CARTÃO DE VACINA
* CURSO FEPECS
* CURSO IGES

Todos os campos são **opcionais**, permitindo que o usuário envie apenas os documentos necessários.

---

# 🛠 Tecnologias utilizadas

* **HTML5**
* **CSS3**
* **JavaScript Vanilla**

A aplicação não depende de frameworks ou backend.

---

# 🚀 Como executar o projeto

1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/renomeador-documentos.git
```

2. Acesse a pasta do projeto

```bash
cd renomeador-documentos
```

3. Abra o arquivo `index.html` no navegador

Ou utilize uma extensão como **Live Server** no VS Code.

---

# 🌐 Deploy

Como o projeto é **100% estático**, ele pode ser hospedado facilmente em:

* GitHub Pages
* Netlify
* Vercel
* Cloudflare Pages

## Exemplo com GitHub Pages

1. Faça push do projeto para um repositório
2. Vá em **Settings → Pages**
3. Selecione:

```
Deploy from branch
main
/root
```

4. O site ficará disponível em:

```
https://seu-usuario.github.io/renomeador-documentos
```

---

# 🔒 Privacidade

Todos os arquivos são processados **localmente no navegador do usuário**.

* Nenhum documento é enviado para servidor
* Nenhum dado é armazenado

---

# 📌 Possíveis melhorias futuras

* Drag and drop para upload de arquivos
* Download de todos os documentos em `.zip`
* Integração com lista de alunos
* Validação automática por tipo de documento
* Interface estilo iLovePDF

---

# 👨‍💻 Autor

Pedro Henrique

Projeto criado para facilitar a organização de documentos de alunos durante processos de estágio e validação institucional.
