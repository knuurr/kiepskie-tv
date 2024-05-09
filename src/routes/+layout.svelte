<script lang="ts">
    import './styles.css'
	import { Styles } from '@sveltestrap/sveltestrap';
	import { Col, Row, Container } from '@sveltestrap/sveltestrap';
	import Header from './Header.svelte';
	// import UploadFile from './UploadFile.svelte';
	import Footer from './Footer.svelte';
  	// import Counter from './Counter.svelte';
	import {APP_TITLE, APP_DESC, APP_TITLE2} from './Constans.svelte'; // Import all from data.js

</script>
<svelte:head>
    <title>{APP_TITLE2}</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
</svelte:head>

<Styles />

<Container sm>
	<Header title={APP_TITLE} desc={APP_DESC}/>
	<slot />
	<Footer></Footer>
</Container>


<style>
	@import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
	/* #container {
		max-width: 100px;
	} */
  </style>