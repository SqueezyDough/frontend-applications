<script>
    export let data;
</script>

<style lang="scss">
    @import "../sass/global.scss";

    .card {
        position: relative;
        margin: .5rem 1rem;
        transition: all .2s;
        z-index: -1;

        footer {
            padding: .5rem;
        }
    }

    .card__image {
        display: block;
        height: 200px;
        width: 100%;
        object-fit: cover;
        box-sizing: border-box;
        border: 1px solid #eee;

        //fallback img
        background-image: url("https://i.ebayimg.com/images/g/8FQAAOSwG5Fc4II4/s-l400.jpg");
        background-size: cover;
        background-position: center;
    }

    .card__title {
        font-family: $primaryFontFamily;
        font-size: 1rem;
    }

    .card__footer {
        text-align: left;

        span {
            visibility: hidden;
        }
    }
</style>

<article class="card">
    <img class="card__image" height="200px" src={data.image.value} alt="">
    <footer class="card__footer">
        <h3 class="card__title">{data.title.value}</h3>
        <span class="card__uri">{data.result.value}</span>
    </footer>
</article>