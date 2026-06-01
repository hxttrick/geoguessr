(async () => {
    const friendIds = (await fetch("/api/v3/social/friendships").then(r => r.json())).friendIds;

    const names = await Promise.all(
        friendIds.map(id =>
            fetch(`/api/v4/player-identities/${id}`)
                .then(r => r.json())
                .then(p => p.player.nick)
        )
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([names.join("\n")], { type: "text/csv" }));
    a.download = "friends.csv";
    a.click();
})();
