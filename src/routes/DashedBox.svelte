<script>
    // export let heading;
    // export let content;
	import { Container, Col, Row } from '@sveltestrap/sveltestrap';

  </script>
  
  <style>
	#dashed-box  {
	  /* width: auto; */
	  min-height: 200px;
	  display: flex;
	flex-direction: column;
	  justify-content: center;
	  align-items: center;
	  /* color: var(--); */
	  /* font-size: 16px; */
	  /* background-color: #000; */
	  border: 2px dashed var(--txt-clr);
	  border-radius: 5px;
    margin-top: 40px;
    margin-bottom: 40px;
	padding-top: 10px;
	padding-bottom: 10px;
	padding-left: 8px;
	padding-right: 8px;
	}

	/* #dashed-box > * { */
		/* margin-top: 15px; */
		/* margin-bottom: 15px; */
	/* } */


  </style>
  
  <div id="dashed-box">
		<slot />
    
  </div>
  