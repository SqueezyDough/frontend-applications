<script>
    import {onMount} from 'svelte';
    import results from './src/data/fetchStatues.js';
    import Statue from './src/components/statue.svelte'

    let data = [];

    onMount( async () => {
        data = await results()
    })
</script>

<ul>
    {#each data as Statue}
        <li>
            <Statue {Statue}/>
        </li>

        {:else}

        Loading...
    {/each}
</ul>