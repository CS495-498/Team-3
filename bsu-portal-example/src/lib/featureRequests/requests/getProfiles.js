export async function getProfiles(userIds) {
    const userProfiles = {};

    await Promise.all(
        userIds.map(async (uid) => {
            if (!uid) {
                userProfiles[uid] = "Anonymous";
                return;
            }

            const res = await fetch(`/api/profiles/${uid}`);

            if (!res.ok) {
                userProfiles[uid] = "Anonymous";
                return;
            }

            const profile = await res.json();
            userProfiles[uid] = profile?.username || "Anonymous";
        })
    );

    return userProfiles;
}