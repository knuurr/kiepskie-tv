<script lang="ts">
    import './styles.css'
	import { Styles } from '@sveltestrap/sveltestrap';
	import { Col, Row, Container } from '@sveltestrap/sveltestrap';
	import Header from './Header.svelte';
	// import UploadFile from './UploadFile.svelte';
	import Footer from './Footer.svelte';
  	// import Counter from './Counter.svelte';

	export let title = 'Kiepskie TV 🍻';
	export let desc = 'Zobacz swoje wideo oczami Ferdka z zapierdziałego fotela';
</script>
<svelte:head>
    <title>Kiepskie TV</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
</svelte:head>

<Styles />

<Container fluid>
	<Row>
		<Col>
		  <!-- <Button color="primary" outline>Hello World!</Button> -->
		  <Header title={title} desc={desc}/>
		</Col>
	</Row>
	<Row>
		<Col>
			<slot />
		</Col>
	</Row>
	<Row>
		<Container sm>
			<Row>
				<Col>
					<Footer></Footer>
				</Col>
			</Row>
		</Container>
	</Row>
</Container>

<style>
	@import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
  </style>