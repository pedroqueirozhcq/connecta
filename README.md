# Connecta

Aplicação web estática para cadastro e gestão de líderes e coordenadores, com visualização de hierarquia. Todos os dados são armazenados localmente no navegador via IndexedDB.

## Principais recursos

- Cadastro, edição e exclusão de pessoas.
- Perfis: Coordenador e Líder.
- Líder deve estar vinculado a um coordenador.
- Busca por nome/telefone e filtro por perfil.
- Dashboard com totais por perfil.
- Mapa de hierarquia por coordenador.
- Dados persistidos localmente (IndexedDB).

## Estrutura

- Página principal: connecta.html
- Estilos: assets/css/styles.css
- Lógica: assets/js/pedro.js

## Como usar

1. Abra o arquivo connecta.html no navegador.
2. Use a seção “Cadastro” para incluir pessoas.
3. Acompanhe os totais no “Dashboard”.
4. Use “Pessoas” para buscar, filtrar, editar e excluir.
5. Veja a hierarquia na seção “Mapa”.

## Regras de vínculo

- Coordenador não escolhe superior.
- Líder deve escolher um coordenador.
- Não é permitido excluir coordenadores com líderes vinculados.

## Dados de exemplo

Ao abrir a aplicação pela primeira vez, são criados registros iniciais para facilitar os testes:

- Coordenador: Pedro
- Líderes: Brendo e João

## Observações

- Os dados ficam no IndexedDB do navegador. Para reiniciar os dados, limpe o armazenamento do site.
- Não há backend: tudo ocorre localmente.

## Requisitos

- Navegador moderno com suporte a IndexedDB (Chrome, Edge, Firefox).
