<script>
    export let data;
</script>

<style lang="scss">
    @import "../sass/global.scss";

    .card {
        padding: 1rem;
    }

    .card__image {
        display: block;
        height: 200px;
    }

    .card__title {
        font-family: $primaryFontFamily;
        font-size: 1rem;
    }
</style>

<div class="card">
    <img class="card__image" height="200px" src={data.image.value} alt={data.title.value}>
    <h1 class="card__title">{data.title.value}</h1>
</div>