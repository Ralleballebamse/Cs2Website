


SELECT * FROM items;
SELECT * FROM prices;
SELECT * FROM users;
SELECT *
FROM items i
LEFT JOIN prices p ON p.item_id = i.id;