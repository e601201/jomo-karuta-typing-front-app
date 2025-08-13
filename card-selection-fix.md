# カード選択視覚フィードバック修正

## 問題

特定札選択モードで、カードを選択した瞬間に枠の色が変わらない

## 原因

1. `toggleCard`メソッドで既存のSetオブジェクトを直接変更していた
2. Svelteストアが変更を検知できなかった（同じSetオブジェクトの参照のため）

## 修正内容

### 1. `/src/lib/stores/specific-cards-store.ts`

```typescript
// Before: 既存のSetを直接変更
toggleCard(cardId: string) {
    update((state) => {
        if (state.selectedCardIds.has(cardId)) {
            state.selectedCardIds.delete(cardId);  // 直接変更
        } else {
            state.selectedCardIds.add(cardId);     // 直接変更
        }
        return { ...state };
    });
}

// After: 新しいSetを作成
toggleCard(cardId: string) {
    update((state) => {
        const newSelectedCardIds = new Set(state.selectedCardIds);  // 新しいSet作成
        if (newSelectedCardIds.has(cardId)) {
            newSelectedCardIds.delete(cardId);
        } else {
            newSelectedCardIds.add(cardId);
        }
        return {
            ...state,
            selectedCardIds: newSelectedCardIds  // 新しいSetを設定
        };
    });
}
```

### 2. `/src/lib/components/specific/CardSelector.svelte`

- `$state`でリアクティブな状態を管理
- `$effect`でストアの更新を監視
- 新しいSetインスタンスを作成して反応性を確保

## テスト方法

1. http://localhost:5173/practice/specific にアクセス
2. カードをクリック
3. 即座に青い枠（選択状態）が表示されることを確認
4. 再度クリックで選択解除されることを確認

## 期待される動作

- カードクリック時に即座に青い枠と背景色が変化
- 選択中: `border-color: #3b82f6; background-color: #dbeafe;`
- ホバー時: `border-color: #60a5fa; background-color: #eff6ff;`
