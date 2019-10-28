<script>
    import {onMount} from 'svelte';
    import results from '../src/data/statues.js';
    import Statue from './components/statue.svelte'

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