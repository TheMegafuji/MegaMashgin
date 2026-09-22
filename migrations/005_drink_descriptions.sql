-- Match the fictional serving descriptions to their new illustrations.
UPDATE products SET description = 'A smooth medium roast in a 12 oz ceramic cup.' WHERE id = 'house-coffee';
UPDATE products SET description = 'Espresso with oat drink, layered in a 12 oz glass.' WHERE id = 'oat-latte';
UPDATE products SET description = 'Black tea with a tea bag, served in a 12 oz cup.' WHERE id = 'english-tea';
