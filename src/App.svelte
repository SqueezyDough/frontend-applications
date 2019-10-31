<script>
  import {onMount} from 'svelte';
  import { Router, Link, Route } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import fetchData from './data/fetchStatues.js';
  import Card from './components/card.svelte'

  let results = [];

  onMount( async () => {
    let rawData = await fetchData();

    let filterNoImage = [
      "http://collectie.wereldculturen.nl/cc/imageproxy.ashx?server=localhost&port=17581&filename=images/Images/TM//tm-3317-1.jpg",
      "http://collectie.wereldculturen.nl/cc/imageproxy.ashx?server=localhost&port=17581&filename=images/Images/TM//tm-343-1b.jpg"
    ]

    // only show data with actual names
    results = rawData.filter( item => {
      return item.title.value
      !== "Godenbeeld" &&
      item.image.value !== filterNoImage[0] &&
      item.image.value !== filterNoImage[1]
    })

    console.log(results);
  })
</script>

<Router>
  <div>
    <Route path="/" component="{Home}" {results}/>
  </div>
</Router>