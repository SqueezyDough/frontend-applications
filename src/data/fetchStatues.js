export default function() {
  const url ="https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-34/sparql"

  const query = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dc: <http://purl.org/dc/elements/1.1/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX edm: <http://www.europeana.eu/schemas/edm/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>

  SELECT distinct ?result ?title ?place ?placeName ?type ?image
  WHERE {
    <https://hdl.handle.net/20.500.11840/termmaster8401> skos:narrower* ?place .
    ?place skos:prefLabel ?placeName .

    VALUES ?type {"Godenbeeld" "godenbeeld"}
    ?result dc:title ?title ;
          dc:type ?type ;
            dct:spatial ?place ;
          edm:isShownBy ?image
  }
  ORDER BY ?result
  LIMIT 100
  `

// modified from lauren's example
// return json from query
function runQuery(url, query){
      return fetch(url+"?query="+ encodeURIComponent(query) +"&format=json")
        .then(res => res.json())
        .then(json => {
          return json.results.bindings;
      })
    }

    return runQuery(url, query)
}