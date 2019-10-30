<script>
  import {onMount} from 'svelte';
  import { Router, Route } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import fetchData from './data/fetchStatues.js';
  import Card from './components/card.svelte'

  let results = [];

  onMount( async () => {
      results = await fetchData()
  })
</script>

<Router>
  <div>
    <Route path="/" component="{Home}" {results}/>
  </div>
</Router>