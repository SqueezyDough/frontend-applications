<script>
const url ="https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-34/sparql"
//Note that the query is wrapped in es6 template strings to allow for easy copy pasting
const query = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX edm: <http://www.europeana.eu/schemas/edm/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT ?result ?title ?place ?type ?image
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
LIMIT 30
`
let results = {};

runQuery(url, query)
//console.log(results)

function runQuery(url, query){
  //Test if the endpoint is up and print result to page
  // (you can improve this script by making the next part of this function wait for a succesful result)
    // Call the url with the query attached, output data
    fetch(url+"?query="+ encodeURIComponent(query) +"&format=json")
        .then(res => res.json())
        .then(json => {
            console.log(json.results.bindings);
            results = json.results.bindings
  })
}
</script>

<style>
img {
    display: block;
    height: 200px;
}
</style>

<ul>
    {#each results as source}
        <li>
            {source.title.value}
            <img src={source.image.value} alt={source.title.value}>
        </li>
    {/each}
</ul>