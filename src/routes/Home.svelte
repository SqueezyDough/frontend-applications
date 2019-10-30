<script>
    import Card from '../components/card.svelte'
    export let results;
</script>

<ul>
    {#each results as data}
        <li>
            <Card {data}/>
        </li>

        {:else}

        Loading...
    {/each}
</ul>