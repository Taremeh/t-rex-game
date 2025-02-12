# Task 2: Life System

Implement a system where the T-Rex has three lives, allowing it to continue after hitting obstacles as long as there is at least one life left. Display the life counter as a number next to the distance meter (top right corner).

Definitions of Done:

- Game starts with 3 lives, displaying the counter in the top-right corner.
- After a collision with an obstacle deduct 1 life.
- Show the GameOver screen, if no lives (i.e., 0 lives) remain.

Hints: 
- After a collision, you might need to set a grace period or move the obstacle, such that the player does not get hit again instantly in the next frame.
- For rendering the remaining lives, you can use the [`lifeCounter`](./src/lifeCounter.ts) component and its [`lifeCounter.update()`](./src/lifeCounter.ts#L58) function. The component behaves similarly to the [`distanceMeter`](./src/distanceMeter.ts) component.

<br/>
<br/>

---

<br/>
<br/>

**[> <ins>Finished task 2? Continue with TASK 3</ins> <](./TASK_3.md)**