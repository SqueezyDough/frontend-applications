<script>
    import persist from 'svelte-persist';
    import Card from '../components/Card.svelte';
    export let results;

    const text = persist('text', '')

    // create new (simple) objects from results
    $: regionNames = results.map( item => item.placeName.value );

    // remove duplicate regions from objects
    $: uniqueRegionNames = [...new Set(regionNames)]

    // items per region
    $: regions = uniqueRegionNames.map( regionName => {
        // console.log(regionName)
        const region = {
            name : regionName,
            items : []
        };

        const regionItems = results.forEach( regionItem => {

            if (regionItem.placeName.value === regionName) {
                region.items.push(regionItem);
            }
        });

        return region;
    });
</script>

<style lang="scss">
@import "../sass/global.scss";
.header {
    display: flex;
    align-items: center;
    padding: 1rem;
}

.header__img {
    width: 6rem;
    height: 6rem;
}
.header__title {
    display: block;
    padding: 1rem;
    font-family: $secondaryFontFamily;
    font-size: 3rem;
}

.intro {
    padding: 1rem;
}

.intro__text {
    max-width: 35rem;
}

.regions-list {
    position: relative;
    margin: 3rem 0 -2rem;

    ul {
        display: flex;
        padding: 1rem;
        list-style-type: none;

        li {
            margin-right: 1rem;
            a {
                font-family: $secondaryFontFamily;
                font-size: $mediumFontSize;
                color: $secondaryThemeColor;
                transition: all .2s;

                &:hover {
                    color: $red;
                }
            }
        }
    }
}

.cards-container {
    @media all and (min-width: 60em) {
        display: grid;
        grid-template-columns: [start] 1fr [line1] 1fr [line2] 1fr [line3] 1fr [end];
    }
}

.cards-container__header {
    grid-column: start / end;
    padding: 1rem;
    border-bottom: 1px solid #eee;
}

.cards-container__cards-btn {
    align-self: start;
    position: relative;
    padding: 0;
    background-color: transparent;
    border: none;
    z-index: 10;
    cursor: pointer;
}

 .termmaster-uri {
    position: fixed;
    top: 3rem;
    right: 1rem;
    padding: 1rem;
    background-color: $red;
    font-family: $primaryFontFamily;
    text-decoration: none;
    color: white;
    z-index: 9999;
    transition: all .2s;

    &:hover {
        background-color: $black;
    }
    label {
        display: block;
        font-family: $secondaryFontFamily;
    }
}
</style>
<div class="wrapper">
    <header class="header">
        <img class="header__img" src="./images/nmvw.png" alt="nmvw">
        <h1 class="header__title">Asian Deities</h1>
    </header>

    <section class="intro">
        <h2>Asian Deities from the collection of the NMVW</h2>
        <p class="intro__text">
            Travelers from non-Asian cultures who travel to Asia often see Gods statues unknown to them.
            In Asian theology (both Buddhism and Hinduism) there are many diffent deities each with their own
            human or non-human form. Most tourists identify these simply as Buddha, but this is often false.
        </p>
        <p class="intro__text">
            I want to inform people about Asian theology using the rich collection from the Dutch National
            Museum of World Cultures (NMVW). I'm using the Svelte framework to achieve this.
        </p>
    </section>

    <nav class="regions-list">
        <ul>
            {#each uniqueRegionNames as uniqueName}
                <li><a href="#{uniqueName}">{uniqueName}</a></li>
            {/each}
        </ul>
    </nav>

    <main class="main">
        {#if $text}
        <a href="{$text}" target="_blank" class="termmaster-uri">
            <label>Termmaster url</label>
            <span>{$text}</span>
        </a>
        {/if}
        <input type="hidden" bind:value={$text} />


        {#each regions as region}
            <section id="{region.name}" class="cards-container">
                <h2 class="cards-container__header">{region.name}</h2>

                {#each region.items as data}
                    <button class="cards-container__cards-btn" on:click={(event) => ($text = event.target.querySelector('span').textContent)}>
                        <Card class="cards-container__card" {data}/>
                    </button>

                    {:else}
                        <span class="loading">Loading...</span>
                {/each}
            </section>
        {/each}
    </main>
</div>