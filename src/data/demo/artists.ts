/**
 * Demo Artist Catalog
 * ~200+ real artists across 20+ genres with song titles for procedural track generation.
 */

export interface DemoArtistEntry {
    name: string;
    genres: string[];
    songs: string[];
    popularity?: number; // 0-100, defaults to 75
}

export const ARTIST_CATALOG: DemoArtistEntry[] = [
    // ─── Pop ───────────────────────────────────────────────
    { name: "Taylor Swift", genres: ["pop", "synth-pop"], songs: ["Cruel Summer", "Anti-Hero", "Shake It Off", "Blank Space", "Love Story", "Cardigan", "Willow", "Style", "Bad Blood", "Delicate", "Fortnight", "Lavender Haze"] },
    { name: "Harry Styles", genres: ["pop", "rock"], songs: ["As It Was", "Watermelon Sugar", "Adore You", "Sign of the Times", "Golden", "Late Night Talking", "Falling", "Kiwi", "Matilda", "Satellite"] },
    { name: "Miley Cyrus", genres: ["pop", "disco"], songs: ["Flowers", "Wrecking Ball", "Party In The U.S.A.", "Midnight Sky", "Malibu", "We Can't Stop", "The Climb", "River", "Used To Be Young"] },
    { name: "The Weeknd", genres: ["pop", "synth-pop", "r&b"], songs: ["Blinding Lights", "Starboy", "Save Your Tears", "Can't Feel My Face", "The Hills", "Earned It", "After Hours", "Die For You", "Heartless", "Out of Time", "I Feel It Coming", "Call Out My Name"] },
    { name: "Dua Lipa", genres: ["pop", "dance-pop", "disco"], songs: ["Levitating", "Don't Start Now", "New Rules", "Physical", "Break My Heart", "One Kiss", "IDGAF", "Love Again", "Cold Heart", "Houdini", "Training Season"] },
    { name: "Billie Eilish", genres: ["pop", "electropop"], songs: ["Bad Guy", "Happier Than Ever", "Everything I Wanted", "Ocean Eyes", "Lovely", "Therefore I Am", "Birds of a Feather", "Lunch", "When The Party's Over", "Bury a Friend"] },
    { name: "Olivia Rodrigo", genres: ["pop", "pop rock"], songs: ["Drivers License", "Good 4 U", "Vampire", "Deja Vu", "Brutal", "Traitor", "Happier", "Get Him Back!", "All-American Bitch", "Bad Idea Right?"] },
    { name: "Ed Sheeran", genres: ["pop", "singer-songwriter"], songs: ["Shape of You", "Perfect", "Thinking Out Loud", "Castle on the Hill", "Photograph", "Bad Habits", "Shivers", "Galway Girl", "Happier", "Supermarket Flowers"] },
    { name: "Ariana Grande", genres: ["pop", "r&b"], songs: ["Thank U, Next", "7 Rings", "Positions", "No Tears Left To Cry", "God Is A Woman", "Into You", "One Last Time", "We Can't Be Friends", "Eternal Sunshine", "Yes, And?"] },
    { name: "Bruno Mars", genres: ["pop", "funk", "r&b"], songs: ["Uptown Funk", "Just The Way You Are", "Locked Out Of Heaven", "24K Magic", "That's What I Like", "Grenade", "When I Was Your Man", "Finesse", "Treasure", "Marry You"] },
    { name: "Justin Bieber", genres: ["pop", "dance-pop"], songs: ["Peaches", "Stay", "Ghost", "Sorry", "Love Yourself", "Baby", "What Do You Mean?", "Intentions", "Yummy", "Holy"] },
    { name: "Adele", genres: ["pop", "soul"], songs: ["Hello", "Rolling In The Deep", "Someone Like You", "Easy On Me", "Set Fire To The Rain", "Skyfall", "When We Were Young", "Oh My God", "Rumour Has It", "Chasing Pavements"], popularity: 90 },
    { name: "Lady Gaga", genres: ["pop", "dance-pop", "electropop"], songs: ["Bad Romance", "Poker Face", "Shallow", "Born This Way", "Alejandro", "Rain On Me", "Just Dance", "Telephone", "Stupid Love", "Die With A Smile"] },
    { name: "Rihanna", genres: ["pop", "r&b", "dance-pop"], songs: ["Umbrella", "We Found Love", "Diamonds", "Work", "Don't Stop The Music", "Stay", "Only Girl", "Rude Boy", "S.O.S.", "Disturbia"] },
    { name: "Post Malone", genres: ["pop", "hip hop"], songs: ["Circles", "Sunflower", "Rockstar", "Congratulations", "Better Now", "I Like You", "Chemical", "Goodbyes", "White Iverson", "Mourning"] },

    // ─── Rock ──────────────────────────────────────────────
    { name: "Nirvana", genres: ["grunge", "rock", "alternative rock"], songs: ["Smells Like Teen Spirit", "Come As You Are", "Lithium", "In Bloom", "Heart-Shaped Box", "All Apologies", "Rape Me", "About A Girl", "Breed", "Drain You"] },
    { name: "The Killers", genres: ["indie rock", "modern rock"], songs: ["Mr. Brightside", "Somebody Told Me", "Human", "When You Were Young", "All These Things That I've Done", "Read My Mind", "Shot At The Night", "Runaways", "Caution", "The Man"] },
    { name: "Foo Fighters", genres: ["rock", "alternative rock"], songs: ["Everlong", "The Pretender", "Best Of You", "Learn To Fly", "My Hero", "Times Like These", "Walk", "Monkey Wrench", "All My Life", "Big Me"] },
    { name: "Queen", genres: ["classic rock", "rock"], songs: ["Bohemian Rhapsody", "Don't Stop Me Now", "We Will Rock You", "We Are The Champions", "Somebody To Love", "Under Pressure", "Radio Ga Ga", "Killer Queen", "Another One Bites The Dust", "I Want To Break Free"], popularity: 92 },
    { name: "Led Zeppelin", genres: ["classic rock", "hard rock"], songs: ["Stairway To Heaven", "Whole Lotta Love", "Kashmir", "Black Dog", "Rock And Roll", "Going To California", "Immigrant Song", "Ramble On", "Since I've Been Loving You", "Dazed And Confused"], popularity: 88 },
    { name: "Arctic Monkeys", genres: ["indie rock", "alternative rock"], songs: ["Do I Wanna Know?", "R U Mine?", "505", "I Bet You Look Good On The Dancefloor", "Fluorescent Adolescent", "Why'd You Only Call Me When You're High?", "Arabella", "Body Paint", "There'd Better Be A Mirrorball", "Crying Lightning"] },
    { name: "Red Hot Chili Peppers", genres: ["rock", "funk rock"], songs: ["Californication", "Under The Bridge", "Can't Stop", "Scar Tissue", "Snow (Hey Oh)", "Otherside", "By The Way", "Dani California", "Give It Away", "Black Summer"] },
    { name: "Radiohead", genres: ["alternative rock", "art rock"], songs: ["Creep", "Karma Police", "No Surprises", "Paranoid Android", "Everything In Its Right Place", "Lucky", "Fake Plastic Trees", "Idioteque", "Exit Music", "15 Step"] },
    { name: "Green Day", genres: ["punk rock", "pop punk"], songs: ["Basket Case", "Boulevard Of Broken Dreams", "American Idiot", "21 Guns", "Holiday", "Wake Me Up When September Ends", "When I Come Around", "Good Riddance", "Longview", "Brain Stew"] },
    { name: "Muse", genres: ["alternative rock", "progressive rock"], songs: ["Supermassive Black Hole", "Starlight", "Uprising", "Time Is Running Out", "Madness", "Knights Of Cydonia", "Hysteria", "Plug In Baby", "Resistance", "Psycho"] },
    { name: "Tame Impala", genres: ["psychedelic rock", "indie rock"], songs: ["The Less I Know The Better", "Let It Happen", "Feels Like We Only Go Backwards", "New Person, Same Old Mistakes", "Elephant", "Borderline", "Lost In Yesterday", "Is It True", "Eventually", "Yes I'm Changing"] },
    { name: "The Strokes", genres: ["indie rock", "garage rock"], songs: ["Reptilia", "Last Nite", "Someday", "Hard To Explain", "Is This It", "Juicebox", "You Only Live Once", "Under Cover of Darkness", "The Adults Are Talking", "At The Door"] },
    { name: "Imagine Dragons", genres: ["pop rock", "alternative rock"], songs: ["Radioactive", "Believer", "Demons", "Thunder", "Whatever It Takes", "Natural", "Bones", "Enemy", "Bad Liar", "It's Time"] },
    { name: "Linkin Park", genres: ["alternative rock", "nu metal"], songs: ["In The End", "Numb", "Crawling", "What I've Done", "New Divide", "Faint", "Breaking The Habit", "Somewhere I Belong", "One Step Closer", "Lost"], popularity: 85 },

    // ─── Hip Hop & Rap ─────────────────────────────────────
    { name: "Drake", genres: ["hip hop", "rap", "canadian hip hop"], songs: ["God's Plan", "One Dance", "Hotline Bling", "Started From The Bottom", "In My Feelings", "Nice For What", "Hold On We're Going Home", "Passionfruit", "Rich Flex", "Jimmy Cooks", "Headlines", "Best I Ever Had"] },
    { name: "Travis Scott", genres: ["hip hop", "rap", "trap"], songs: ["SICKO MODE", "goosebumps", "HIGHEST IN THE ROOM", "Antidote", "Butterfly Effect", "STARGAZING", "Pick Up The Phone", "FE!N", "MY EYES", "HYAENA", "Telekinesis"] },
    { name: "Kendrick Lamar", genres: ["hip hop", "rap", "conscious hip hop"], songs: ["HUMBLE.", "Alright", "DNA.", "LOVE.", "Money Trees", "Swimming Pools", "Not Like Us", "United In Grief", "King Kunta", "Bitch Don't Kill My Vibe", "LOYALTY."] },
    { name: "Nas", genres: ["hip hop", "east coast hip hop"], songs: ["N.Y. State of Mind", "The World Is Yours", "If I Ruled The World", "Made You Look", "It Ain't Hard To Tell", "One Mic", "Illmatic", "Life's A Bitch", "Ether", "Got Yourself A Gun"], popularity: 78 },
    { name: "Kanye West", genres: ["hip hop", "rap"], songs: ["Stronger", "Gold Digger", "Runaway", "All Of The Lights", "Power", "Heartless", "Black Skinhead", "Ultralight Beam", "Flashing Lights", "Monster", "Bound 2", "Father Stretch My Hands"], popularity: 88 },
    { name: "J. Cole", genres: ["hip hop", "rap", "conscious hip hop"], songs: ["No Role Modelz", "Middle Child", "GOMD", "Wet Dreamz", "She Knows", "Work Out", "Power Trip", "Apparently", "Love Yourz", "Crooked Smile"] },
    { name: "Eminem", genres: ["hip hop", "rap"], songs: ["Lose Yourself", "The Real Slim Shady", "Without Me", "Not Afraid", "Stan", "Love The Way You Lie", "Rap God", "Mockingbird", "Till I Collapse", "Godzilla", "My Name Is", "Cleanin' Out My Closet"], popularity: 90 },
    { name: "Tyler, The Creator", genres: ["hip hop", "alternative hip hop"], songs: ["See You Again", "EARFQUAKE", "New Magic Wand", "IFHY", "A BOY IS A GUN", "WUSYANAME", "Yonkers", "Who Dat Boy", "LUMBERJACK", "SORRY NOT SORRY"] },
    { name: "21 Savage", genres: ["hip hop", "trap", "rap"], songs: ["A Lot", "Rockstar", "Bank Account", "No Heart", "Redrum", "X", "Knife Talk", "Savage Mode", "Many Men", "Dangerous"] },
    { name: "Lil Baby", genres: ["hip hop", "trap", "rap"], songs: ["Drip Too Hard", "Emotionally Scarred", "Woah", "Yes Indeed", "The Bigger Picture", "In A Minute", "Freestyle", "We Paid", "Close Friends", "Forever"] },
    { name: "Metro Boomin", genres: ["hip hop", "trap"], songs: ["Creepin'", "Superhero", "Too Many Nights", "Like That", "Heartless", "Space Cadet", "Around Me", "Runnin", "Trance", "Raindrops"] },
    { name: "Future", genres: ["hip hop", "trap", "rap"], songs: ["Mask Off", "March Madness", "Life Is Good", "Wait For U", "Low Life", "Wicked", "Jumpman", "Codeine Crazy", "Commas", "Turn On The Lights"] },
    { name: "Megan Thee Stallion", genres: ["hip hop", "rap"], songs: ["Savage", "WAP", "Body", "Hot Girl Summer", "Plan B", "Pressurelicious", "Cobra", "Her", "Sweetest Pie", "Girls In The Hood"] },

    // ─── Electronic & Dance ────────────────────────────────
    { name: "Daft Punk", genres: ["disco", "electronic", "french house"], songs: ["Get Lucky", "Around The World", "One More Time", "Harder Better Faster Stronger", "Instant Crush", "Digital Love", "Something About Us", "Lose Yourself To Dance", "Robot Rock", "Veridis Quo"], popularity: 85 },
    { name: "Zedd", genres: ["edm", "pop dance", "electro house"], songs: ["Clarity", "The Middle", "Stay The Night", "Beautiful Now", "I Want You To Know", "Stay", "Spectrum", "Adrenaline", "Funny", "Happy Now"] },
    { name: "Avicii", genres: ["edm", "progressive house"], songs: ["Levels", "Wake Me Up", "Hey Brother", "The Nights", "Waiting For Love", "Without You", "You Make Me", "Addicted To You", "Lonely Together", "Silhouettes"], popularity: 82 },
    { name: "deadmau5", genres: ["electronic", "progressive house"], songs: ["Strobe", "Ghosts n Stuff", "I Remember", "Some Chords", "Raise Your Weapon", "The Veldt", "Monophobia", "There Might Be Coffee", "Avaritia", "FML"] },
    { name: "Calvin Harris", genres: ["edm", "dance-pop", "electronic"], songs: ["Summer", "Feel So Close", "This Is What You Came For", "Slide", "Outside", "Sweet Nothing", "My Way", "How Deep Is Your Love", "Acceptable In The 80s", "Miracle"] },
    { name: "Skrillex", genres: ["edm", "dubstep", "electronic"], songs: ["Bangarang", "Scary Monsters And Nice Sprites", "First Of The Year", "Cinema", "Make It Bun Dem", "Rumble", "Supersonic", "Kill Everybody", "Summit", "Purple Lamborghini"] },
    { name: "ODESZA", genres: ["electronic", "indie electronic"], songs: ["A Moment Apart", "Say My Name", "Line Of Sight", "Higher Ground", "The Last Goodbye", "All We Need", "Loyal", "Better Now", "Behind The Sun", "Wide Awake"] },
    { name: "Flume", genres: ["electronic", "future bass"], songs: ["Never Be Like You", "Say It", "Holdin On", "Rushing Back", "Insane", "Hyperreal", "Smoke and Retribution", "Lose It", "Heater", "Palaces"] },
    { name: "Disclosure", genres: ["electronic", "house", "uk garage"], songs: ["Latch", "White Noise", "When A Fire Starts To Burn", "Omen", "You & Me", "Help Me Lose My Mind", "F For You", "Magnets", "Holding On", "Ecstasy"] },
    { name: "Martin Garrix", genres: ["edm", "progressive house"], songs: ["Animals", "In The Name Of Love", "Scared To Be Lonely", "There For You", "High On Life", "Summer Days", "Tremor", "Virus", "Dreamer", "These Are The Times"] },
    { name: "Kygo", genres: ["tropical house", "electronic"], songs: ["Firestone", "It Ain't Me", "Stole The Show", "Higher Love", "Happy Now", "Stranger Things", "Stay", "Remind Me To Forget", "Freedom", "Never Let You Go"] },

    // ─── Lo-Fi & Chillhop ──────────────────────────────────
    { name: "Nujabes", genres: ["chillhop", "lo-fi", "electronic"], songs: ["Aruarian Dance", "Feather", "Luv(sic) pt.3", "Reflection Eternal", "Counting Stars", "Lady Brown", "Shiki no Uta", "Latitude", "Blessing It", "Modal Soul"], popularity: 70 },
    { name: "Galt MacDermot", genres: ["lo-fi", "jazz", "electronic"], songs: ["Coffee Cold", "Space", "Ripped Open", "Let The Sunshine In", "Aquarius", "Walking In Space", "Easy To Be Hard", "Good Morning Starshine", "I Got Life", "Hair"] },
    { name: "Tomppabeats", genres: ["lo-fi", "chillhop"], songs: ["Monday Loop", "You're Cute", "I Miss You", "Hometown", "Harbor", "Free", "Summer Love", "Rainy Nights", "Study Session", "Passing By"], popularity: 55 },
    { name: "Idealism", genres: ["lo-fi", "chillhop", "ambient"], songs: ["Contrails", "Roadside", "Daylight", "Last Summer", "Angeline", "Night Owl", "Euphoria", "Distant Memory", "Serenity", "Reflections"], popularity: 50 },

    // ─── Jazz ──────────────────────────────────────────────
    { name: "Dave Brubeck", genres: ["jazz", "cool jazz"], songs: ["Take Five", "Blue Rondo à la Turk", "Unsquare Dance", "Strange Meadow Lark", "In Your Own Sweet Way", "The Duke", "Three To Get Ready", "Kathy's Waltz", "Pick Up Sticks", "It's A Raggy Waltz"], popularity: 70 },
    { name: "Miles Davis", genres: ["jazz", "cool jazz", "hard bop"], songs: ["So What", "Blue In Green", "All Blues", "Freddie Freeloader", "Kind of Blue", "Nefertiti", "Bitches Brew", "Flamenco Sketches", "In A Silent Way", "Milestones"], popularity: 78 },
    { name: "Nina Simone", genres: ["vocal jazz", "blues", "soul"], songs: ["Feeling Good", "My Baby Just Cares For Me", "I Put A Spell On You", "Sinnerman", "Ain't Got No / I Got Life", "Ne Me Quitte Pas", "Lilac Wine", "Mississippi Goddam", "I Loves You Porgy", "Don't Let Me Be Misunderstood"], popularity: 75 },
    { name: "John Coltrane", genres: ["jazz", "hard bop", "free jazz"], songs: ["A Love Supreme", "My Favorite Things", "Giant Steps", "Naima", "Blue Train", "Impressions", "Equinox", "Central Park West", "Lazy Bird", "Mr. P.C."], popularity: 72 },
    { name: "Thelonious Monk", genres: ["jazz", "bebop"], songs: ["Round Midnight", "Blue Monk", "Straight No Chaser", "Ruby My Dear", "Well You Needn't", "In Walked Bud", "Epistrophy", "Bemsha Swing", "Ask Me Now", "Crepuscule With Nellie"], popularity: 68 },
    { name: "Chet Baker", genres: ["jazz", "cool jazz", "vocal jazz"], songs: ["Almost Blue", "My Funny Valentine", "I Fall In Love Too Easily", "Let's Get Lost", "But Not For Me", "The Thrill Is Gone", "Look For The Silver Lining", "Time After Time", "Autumn Leaves", "You Don't Know What Love Is"], popularity: 72 },
    { name: "Ella Fitzgerald", genres: ["jazz", "vocal jazz", "swing"], songs: ["Summertime", "Dream A Little Dream Of Me", "Cheek To Cheek", "Blue Skies", "Night And Day", "A-Tisket A-Tasket", "Misty", "How High The Moon", "Mack The Knife", "Someone To Watch Over Me"], popularity: 75 },
    { name: "Kamasi Washington", genres: ["jazz", "spiritual jazz"], songs: ["Truth", "Fists of Fury", "Street Fighter Mas", "The Epic", "Re Run Home", "Hub-Tones", "Leroy And Lanisha", "Change Of The Guard", "Song For The Fallen", "Clair de Lune"], popularity: 60 },

    // ─── Blues ──────────────────────────────────────────────
    { name: "B.B. King", genres: ["blues", "electric blues"], songs: ["The Thrill Is Gone", "Sweet Little Angel", "Every Day I Have The Blues", "Lucille", "3 O'Clock Blues", "Rock Me Baby", "Paying The Cost To Be The Boss", "Ain't Nobody Home", "Chains and Things", "Why I Sing The Blues"], popularity: 72 },
    { name: "Muddy Waters", genres: ["blues", "chicago blues"], songs: ["Hoochie Coochie Man", "Mannish Boy", "Rollin' Stone", "Got My Mojo Working", "I Just Want To Make Love To You", "Baby Please Don't Go", "I Can't Be Satisfied", "Louisiana Blues", "Champagne and Reefer", "Still A Fool"], popularity: 68 },
    { name: "Gary Clark Jr.", genres: ["blues", "blues rock"], songs: ["Come Together", "When My Train Pulls In", "Bright Lights", "This Land", "Pearl Cadillac", "The Healing", "Numb", "What About Us", "Ain't Messin Round", "Our Love"], popularity: 65 },

    // ─── R&B & Soul ────────────────────────────────────────
    { name: "Stevie Wonder", genres: ["soul", "funk", "motown"], songs: ["Superstition", "Isn't She Lovely", "Sir Duke", "I Wish", "Signed Sealed Delivered", "Higher Ground", "For Once In My Life", "You Are The Sunshine Of My Life", "As", "Overjoyed"], popularity: 85 },
    { name: "Marvin Gaye", genres: ["soul", "classic soul", "r&b"], songs: ["What's Going On", "Let's Get It On", "Sexual Healing", "I Heard It Through The Grapevine", "Ain't No Mountain High Enough", "Mercy Mercy Me", "Got To Give It Up", "Inner City Blues", "Distant Lover", "After The Dance"], popularity: 82 },
    { name: "Earth, Wind & Fire", genres: ["disco", "soul", "funk"], songs: ["September", "Let's Groove", "Boogie Wonderland", "Shining Star", "Fantasy", "After The Love Has Gone", "Reasons", "That's The Way Of The World", "Sing A Song", "Serpentine Fire"], popularity: 80 },
    { name: "Frank Ocean", genres: ["r&b", "alternative r&b"], songs: ["Thinkin Bout You", "Nights", "Ivy", "Chanel", "Pink + White", "Nikes", "Self Control", "Solo", "Pyramids", "White Ferrari", "Godspeed", "Blonde"] },
    { name: "SZA", genres: ["r&b", "alternative r&b", "pop"], songs: ["Kill Bill", "Good Days", "Snooze", "Kiss Me More", "Love Galore", "The Weekend", "Shirt", "Nobody Gets Me", "Broken Clocks", "All The Stars"] },
    { name: "Daniel Caesar", genres: ["r&b", "alternative r&b"], songs: ["Best Part", "Get You", "Japanese Denim", "Peaches", "Who Hurt You?", "Cyanide", "Transform", "We Find Love", "Streetcar", "Please Do Not Lean"] },
    { name: "Khalid", genres: ["r&b", "pop"], songs: ["Talk", "Location", "Better", "Young Dumb & Broke", "Love Lies", "Eastside", "8TEEN", "Saved", "OTW", "Saturday Nights"] },
    { name: "Steve Lacy", genres: ["r&b", "alternative r&b", "indie"], songs: ["Bad Habit", "Dark Red", "Mercury", "Helmet", "N Side", "Ryd", "Static", "C U Girl", "Buttons", "Playground"] },

    // ─── Country ───────────────────────────────────────────
    { name: "Chris Stapleton", genres: ["country", "country rock", "soul"], songs: ["Tennessee Whiskey", "Starting Over", "Broken Halos", "Fire Away", "Millionaire", "Parachute", "Joy of My Life", "You Should Probably Leave", "Arkansas", "White Horse"] },
    { name: "Dolly Parton", genres: ["country", "classic country"], songs: ["Jolene", "9 to 5", "I Will Always Love You", "Coat of Many Colors", "Here You Come Again", "Islands In The Stream", "Two Doors Down", "Why'd You Come In Here Lookin' Like That", "Dumb Blonde", "Light of a Clear Blue Morning"], popularity: 80 },
    { name: "Morgan Wallen", genres: ["country", "country pop"], songs: ["Last Night", "Thought You Should Know", "Whiskey Glasses", "Wasted On You", "Sand In My Boots", "Chasin' You", "More Than My Hometown", "7 Summers", "You Proof", "I Wrote The Book"] },
    { name: "Luke Combs", genres: ["country", "country pop"], songs: ["Beautiful Crazy", "When It Rains It Pours", "Hurricane", "Beer Never Broke My Heart", "She Got The Best Of Me", "Fast Car", "Even Though I'm Leaving", "Better Together", "Lovin' On You", "Forever After All"] },
    { name: "Zach Bryan", genres: ["country", "folk", "americana"], songs: ["Something In The Orange", "I Remember Everything", "Heading South", "Sun to Me", "Revival", "Burn Burn Burn", "Oklahoma Smokeshow", "Heavy Eyes", "Hey Driver", "Tourniquet"] },
    { name: "Kacey Musgraves", genres: ["country", "country pop", "singer-songwriter"], songs: ["Follow Your Arrow", "Slow Burn", "Rainbow", "Space Cowboy", "Butterflies", "Golden Hour", "Merry Go Round", "High Horse", "Deeper Well", "Too Good To Be True"] },

    // ─── Metal ─────────────────────────────────────────────
    { name: "Metallica", genres: ["metal", "thrash metal", "rock"], songs: ["Master of Puppets", "Enter Sandman", "Nothing Else Matters", "One", "Fade To Black", "Seek and Destroy", "The Unforgiven", "For Whom The Bell Tolls", "Sandman", "Creeping Death", "Ride The Lightning", "Battery"], popularity: 88 },
    { name: "System Of A Down", genres: ["alternative metal", "nu metal", "rock"], songs: ["Chop Suey!", "Toxicity", "B.Y.O.B.", "Aerials", "Lonely Day", "Hypnotize", "Sugar", "Roulette", "Question!", "Cigaro"] },
    { name: "Slipknot", genres: ["metal", "nu metal"], songs: ["Duality", "Before I Forget", "Psychosocial", "Wait And Bleed", "Snuff", "The Devil In I", "Unsainted", "Dead Memories", "Sulfur", "Nero Forte"] },
    { name: "Avenged Sevenfold", genres: ["metal", "hard rock"], songs: ["Bat Country", "Hail to the King", "Afterlife", "A Little Piece of Heaven", "So Far Away", "Nightmare", "Seize The Day", "Almost Easy", "Shepherd of Fire", "Nobody"] },
    { name: "Iron Maiden", genres: ["metal", "heavy metal"], songs: ["The Trooper", "Run To The Hills", "Fear Of The Dark", "Hallowed Be Thy Name", "Aces High", "Wasted Years", "Number Of The Beast", "2 Minutes To Midnight", "Phantom Of The Opera", "Powerslave"], popularity: 82 },
    { name: "Black Sabbath", genres: ["metal", "heavy metal", "rock"], songs: ["Paranoid", "Iron Man", "War Pigs", "Black Sabbath", "Children of the Grave", "N.I.B.", "Sweet Leaf", "Snowblind", "Hole In The Sky", "Sabbath Bloody Sabbath"], popularity: 80 },
    { name: "Tool", genres: ["progressive metal", "alternative metal"], songs: ["Lateralus", "Schism", "Sober", "46 & 2", "The Pot", "Vicarious", "Stinkfist", "Ænema", "Parabola", "Fear Inoculum"] },
    { name: "Gojira", genres: ["metal", "progressive metal"], songs: ["Stranded", "Silvera", "Flying Whales", "The Art of Dying", "L'Enfant Sauvage", "Backbone", "Born For One Thing", "Amazonia", "Sphinx", "Our Time Is Now"], popularity: 65 },

    // ─── Folk & Singer-Songwriter ──────────────────────────
    { name: "Tracy Chapman", genres: ["folk", "singer-songwriter", "acoustic"], songs: ["Fast Car", "Talkin' Bout A Revolution", "Give Me One Reason", "Baby Can I Hold You", "Crossroads", "Change", "Mountains O' Things", "New Beginning", "The Promise", "Open Arms"], popularity: 72 },
    { name: "Bon Iver", genres: ["indie folk", "acoustic", "singer-songwriter"], songs: ["Skinny Love", "Holocene", "Re: Stacks", "Perth", "Flume", "Towers", "Blood Bank", "33 God", "Heavenly Father", "Hey, Ma"] },
    { name: "Hozier", genres: ["folk", "indie folk", "singer-songwriter"], songs: ["Take Me To Church", "Cherry Wine", "From Eden", "Work Song", "Someone New", "Almost (Sweet Music)", "Too Sweet", "Francesca", "Movement", "Nobody"] },
    { name: "Phoebe Bridgers", genres: ["indie folk", "singer-songwriter"], songs: ["Motion Sickness", "Kyoto", "I Know The End", "Scott Street", "Garden Song", "Savior Complex", "Funeral", "Chinese Satellite", "Moon Song", "Graceland Too"] },
    { name: "Fleet Foxes", genres: ["indie folk", "folk"], songs: ["White Winter Hymnal", "Mykonos", "Tiger Mountain Peasant Song", "Blue Ridge Mountains", "Helplessness Blues", "Montezuma", "Ragged Wood", "Can I Believe You", "Crack-Up", "A Long Way Past The Past"] },
    { name: "Iron & Wine", genres: ["indie folk", "folk", "acoustic"], songs: ["Flightless Bird American Mouth", "Naked As We Came", "Boy With A Coin", "Such Great Heights", "The Trapeze Swinger", "Upward Over The Mountain", "Jezebel", "Each Coming Night", "Love Vigilantes", "Call It Dreaming"] },
    { name: "James Taylor", genres: ["folk", "singer-songwriter", "soft rock"], songs: ["Fire And Rain", "You've Got A Friend", "How Sweet It Is", "Carolina In My Mind", "Mexico", "Sweet Baby James", "Your Smiling Face", "Shower The People", "Copperline", "Something In The Way She Moves"], popularity: 72 },

    // ─── Classical ─────────────────────────────────────────
    { name: "Claude Debussy", genres: ["classical", "impressionism", "piano"], songs: ["Clair de Lune", "Arabesque No. 1", "Rêverie", "La Mer", "Prelude to the Afternoon of a Faun", "Golliwog's Cakewalk", "The Girl With The Flaxen Hair", "Moonlight", "Voiles", "Pagodes"], popularity: 65 },
    { name: "Ludwig van Beethoven", genres: ["classical", "orchestral"], songs: ["Symphony No. 5", "Moonlight Sonata", "Für Elise", "Symphony No. 9", "Pathétique Sonata", "Piano Concerto No. 5", "String Quartet No. 14", "Symphony No. 7", "Violin Concerto", "Waldstein Sonata"], popularity: 70 },
    { name: "Antonio Vivaldi", genres: ["classical", "baroque"], songs: ["The Four Seasons: Spring", "The Four Seasons: Summer", "The Four Seasons: Autumn", "The Four Seasons: Winter", "Gloria", "Nulla in Mundo Pax Sincera", "Concerto for Two Violins", "Stabat Mater", "La Stravaganza", "L'estro Armonico"], popularity: 68 },
    { name: "Frédéric Chopin", genres: ["classical", "romantic", "piano"], songs: ["Nocturne Op. 9 No. 2", "Ballade No. 1", "Waltz in C-Sharp Minor", "Prelude in E Minor", "Fantaisie-Impromptu", "Raindrop Prelude", "Revolutionary Etude", "Heroic Polonaise", "Minute Waltz", "Berceuse"], popularity: 68 },
    { name: "Johann Sebastian Bach", genres: ["classical", "baroque"], songs: ["Cello Suite No. 1", "Toccata and Fugue in D Minor", "Air on the G String", "Brandenburg Concerto No. 3", "Goldberg Variations", "Well-Tempered Clavier", "Mass in B Minor", "Jesu, Joy of Man's Desiring", "Chaconne", "Sleepers Awake"], popularity: 70 },
    { name: "Ludovico Einaudi", genres: ["classical", "contemporary classical", "piano"], songs: ["Nuvole Bianche", "Experience", "Fly", "I Giorni", "Una Mattina", "Divenire", "Primavera", "Night", "Oltremare", "Le Onde"], popularity: 72 },
    { name: "Yo-Yo Ma", genres: ["classical", "cello"], songs: ["Prelude from Bach Cello Suite No. 1", "Unaccompanied Cello Suite No. 1", "The Swan", "Concerto in B Minor", "Appalachian Waltz", "Libertango", "Sarabande", "Oblivion", "Song of the Birds", "Going Home"], popularity: 65 },

    // ─── Latin & Reggaeton ─────────────────────────────────
    { name: "Bad Bunny", genres: ["reggaeton", "latin", "trap latino"], songs: ["Un Verano Sin Ti", "Tití Me Preguntó", "Dakiti", "Callaíta", "Yonaguni", "Me Porto Bonito", "Moscow Mule", "Efecto", "Ojitos Lindos", "WHERE SHE GOES", "Monaco", "Un Preview"] },
    { name: "Luis Fonsi", genres: ["latin", "reggaeton", "pop"], songs: ["Despacito", "Échame La Culpa", "No Me Doy Por Vencido", "Aquí Estoy Yo", "Nada Es Para Siempre", "Llegaste Tú", "Imposible", "Corazón En La Maleta", "Sola", "Calypso"] },
    { name: "Don Omar", genres: ["latin pop", "reggaeton", "dance"], songs: ["Danza Kuduro", "Dale Don Dale", "Taboo", "Virtual Diva", "Conteo", "Pobre Diablo", "Reggaeton Latino", "Salio El Sol", "Lucenzo", "Bandoleros"] },
    { name: "Shakira", genres: ["latin pop", "colombian pop", "dance pop"], songs: ["Hips Don't Lie", "Whenever Wherever", "Waka Waka", "La Tortura", "She Wolf", "Chantaje", "Can't Remember To Forget You", "Loca", "BZRP Music Session 53", "Rabiosa", "Empire", "Objection"] },
    { name: "J Balvin", genres: ["reggaeton", "latin", "trap latino"], songs: ["Mi Gente", "Ay Vamos", "Safari", "Ginza", "6 AM", "Yo Te Lo Dije", "No Me Conoce", "Morado", "Rojo", "Agua"] },
    { name: "Daddy Yankee", genres: ["reggaeton", "latin", "dance"], songs: ["Gasolina", "Despacito", "Con Calma", "Dura", "Shaky Shaky", "Limbo", "Que Tire Pa Lante", "Rompe", "Ella Me Levanto", "La Noche De Los Dos"] },
    { name: "Rosalía", genres: ["latin pop", "flamenco pop", "reggaeton"], songs: ["Malamente", "Con Altura", "Despechá", "Bizcochito", "SAOKO", "LA FAMA", "CANDY", "CHICKEN TERIYAKI", "Aute Cuture", "Hentai"] },
    { name: "Karol G", genres: ["reggaeton", "latin pop"], songs: ["Tusa", "Bichota", "Provenza", "TQG", "MAMIII", "Mi Ex Tenía Razón", "Amargura", "200 Copas", "Ocean", "El Makinon"] },

    // ─── K-Pop ─────────────────────────────────────────────
    { name: "BTS", genres: ["k-pop", "pop", "boy band"], songs: ["Dynamite", "Butter", "Boy With Luv", "Spring Day", "Fake Love", "DNA", "Idol", "Blood Sweat & Tears", "Mic Drop", "Permission To Dance", "Run", "Life Goes On"] },
    { name: "BLACKPINK", genres: ["k-pop", "k-pop girl group", "pop"], songs: ["How You Like That", "DDU-DU DDU-DU", "Kill This Love", "Lovesick Girls", "Pink Venom", "Shut Down", "As If It's Your Last", "Playing With Fire", "Boombayah", "Ice Cream"] },
    { name: "Stray Kids", genres: ["k-pop", "boy band"], songs: ["God's Menu", "MANIAC", "Thunderous", "Back Door", "S-Class", "LALALALA", "Hellevator", "Miroh", "District 9", "Cheese"] },
    { name: "NewJeans", genres: ["k-pop", "k-pop girl group", "pop"], songs: ["Super Shy", "OMG", "Ditto", "Attention", "Hype Boy", "ETA", "Cookie", "Hurt", "Zero", "How Sweet"] },
    { name: "SEVENTEEN", genres: ["k-pop", "boy band", "pop"], songs: ["Super", "HOT", "Don't Wanna Cry", "Very Nice", "Thanks", "Left & Right", "MAESTRO", "Home", "Fearless", "Rock with you"] },
    { name: "aespa", genres: ["k-pop", "k-pop girl group", "electropop"], songs: ["Next Level", "Savage", "Black Mamba", "Dreams Come True", "Supernova", "Armageddon", "Girls", "Better Things", "Drama", "Hold On Tight"] },
    { name: "(G)I-DLE", genres: ["k-pop", "k-pop girl group"], songs: ["Queencard", "TOMBOY", "LATATA", "Oh My God", "HWAA", "Nxde", "I DO", "Super Lady", "HANN", "DUMDi DUMDi"] },

    // ─── J-Pop & Anime ─────────────────────────────────────
    { name: "YOASOBI", genres: ["j-pop", "anime"], songs: ["Racing Into The Night", "Idol", "Blue", "Monster", "Tabun", "Kaibutsu", "Biri-Biri", "Encore", "Mister", "The Blessing"] },
    { name: "Kenshi Yonezu", genres: ["j-pop", "j-rock"], songs: ["Lemon", "KICK BACK", "Pale Blue", "Peace Sign", "Flamingo", "orion", "Eine Kleine", "LADY", "Canary", "Sand Planet"] },
    { name: "LiSA", genres: ["j-pop", "anime", "j-rock"], songs: ["Gurenge", "Homura", "Crossing Field", "Unlasting", "Catch the Moment", "oath sign", "Rising Hope", "Brave Freak Out", "Adamas", "Akeboshi"] },
    { name: "Ado", genres: ["j-pop", "anime"], songs: ["New Genesis", "Usseewa", "Show", "Tot Musica", "Backlight", "Readymade", "Odo", "Gira Gira", "Rebellion", "Unravel"] },

    // ─── Indie & Alternative ───────────────────────────────
    { name: "M83", genres: ["indie pop", "synth-pop", "electronic"], songs: ["Midnight City", "Wait", "Outro", "Intro", "Reunion", "Steve McQueen", "Kim & Jessie", "Solitude", "Do It Try It", "Oblivion"] },
    { name: "Franz Ferdinand", genres: ["indie rock", "garage rock", "post-punk revival"], songs: ["Take Me Out", "Do You Want To", "This Fire", "Ulysses", "No You Girls", "The Dark Of The Matinée", "Walk Away", "Evil Eye", "Outsiders", "Love Illumination"] },
    { name: "Florence + The Machine", genres: ["indie pop", "art pop", "baroque pop"], songs: ["Dog Days Are Over", "Shake It Out", "Spectrum", "Cosmic Love", "Hunger", "Ship To Wreck", "Drumming Song", "You've Got The Love", "Free", "My Love"] },
    { name: "Coldplay", genres: ["piano rock", "alternative rock", "pop rock"], songs: ["Clocks", "Yellow", "The Scientist", "Fix You", "Viva La Vida", "Paradise", "A Sky Full Of Stars", "Speed Of Sound", "Something Just Like This", "Hymn For The Weekend", "Adventure Of A Lifetime", "My Universe"] },
    { name: "Mac DeMarco", genres: ["indie pop", "indie rock"], songs: ["Chamber Of Reflection", "My Old Man", "Salad Days", "Ode To Viceroy", "Let Her Go", "Still Beating", "On The Level", "Dreaming", "Here Comes The Cowboy", "Nobody"] },
    { name: "Glass Animals", genres: ["indie pop", "psychedelic pop"], songs: ["Heat Waves", "Gooey", "Dreamland", "The Other Side of Paradise", "Youth", "Agnes", "Tangerine", "Space Ghost Coast To Coast", "Tokyo Drifting", "I Don't Wanna Talk"] },
    { name: "Vampire Weekend", genres: ["indie pop", "indie rock"], songs: ["A-Punk", "Oxford Comma", "Harmony Hall", "Unbelievers", "Giving Up The Gun", "Step", "Diane Young", "Cape Cod Kwassa Kwassa", "Mansard Roof", "Sunflower"] },
    { name: "The 1975", genres: ["indie pop", "synth-pop", "pop rock"], songs: ["Somebody Else", "The Sound", "It's Not Living", "Love It If We Made It", "Chocolate", "Robbers", "About You", "I'm In Love With You", "Happiness", "Oh Caroline"] },
    { name: "Mitski", genres: ["indie pop", "indie rock", "art pop"], songs: ["My Love Mine All Mine", "Washing Machine Heart", "Nobody", "Your Best American Girl", "I Bet On Losing Dogs", "Francis Forever", "First Love / Late Spring", "Happy", "Working for the Knife", "Love Me More"] },
    { name: "Beach House", genres: ["dream pop", "indie pop"], songs: ["Space Song", "Myth", "Silver Soul", "Lazuli", "PPP", "Sparks", "Lose Your Smile", "Once Twice Melody", "Dark Spring", "Lemon Glow"] },
    { name: "Arcade Fire", genres: ["indie rock", "art rock"], songs: ["Wake Up", "Rebellion (Lies)", "The Suburbs", "Sprawl II", "Ready To Start", "Reflektor", "No Cars Go", "Everything Now", "Afterlife", "Neighborhood #1 (Tunnels)"] },

    // ─── Punk & Post-Punk ──────────────────────────────────
    { name: "The Ramones", genres: ["punk", "punk rock"], songs: ["Blitzkrieg Bop", "I Wanna Be Sedated", "Sheena Is A Punk Rocker", "Rockaway Beach", "Pet Sematary", "Beat on the Brat", "Teenage Lobotomy", "Pinhead", "Spider-Man", "Judy Is A Punk"], popularity: 72 },
    { name: "The Clash", genres: ["punk", "punk rock", "new wave"], songs: ["London Calling", "Should I Stay or Should I Go", "Rock the Casbah", "Train in Vain", "Straight to Hell", "White Riot", "I Fought the Law", "Lost in the Supermarket", "Complete Control", "Spanish Bombs"], popularity: 75 },
    { name: "Joy Division", genres: ["post-punk", "gothic rock"], songs: ["Love Will Tear Us Apart", "Disorder", "Atmosphere", "She's Lost Control", "Shadowplay", "Transmission", "New Dawn Fades", "Day Of The Lords", "Isolation", "Heart and Soul"], popularity: 70 },
    { name: "Blink-182", genres: ["pop punk", "punk rock"], songs: ["All The Small Things", "I Miss You", "What's My Age Again?", "Dammit", "Adam's Song", "Feeling This", "The Rock Show", "First Date", "EDGING", "Stay Together for the Kids"] },

    // ─── Reggae & Ska ──────────────────────────────────────
    { name: "Bob Marley & The Wailers", genres: ["reggae", "roots reggae", "ska"], songs: ["Three Little Birds", "One Love", "No Woman No Cry", "Redemption Song", "Buffalo Soldier", "Is This Love", "Jamming", "Get Up Stand Up", "Could You Be Loved", "Stir It Up"], popularity: 85 },
    { name: "Sublime", genres: ["ska punk", "reggae rock", "punk"], songs: ["Santeria", "What I Got", "Wrong Way", "Smoke Two Joints", "April 29 1992", "Garden Grove", "Doin' Time", "Badfish", "Caress Me Down", "Date Rape"] },
    { name: "Peter Tosh", genres: ["reggae", "roots reggae"], songs: ["Legalize It", "Equal Rights", "Stepping Razor", "Get Up Stand Up", "Johnny B. Goode", "Mama Africa", "Bush Doctor", "Mystic Man", "Glass House", "Downpressor Man"], popularity: 62 },

    // ─── Ambient & New Age ─────────────────────────────────
    { name: "Marconi Union", genres: ["ambient", "new age", "electronic"], songs: ["Weightless", "Flying", "Breathe", "Departure", "Ghost Station", "Always Nearing", "West Coast Secret", "On Reflection", "Signals", "Lost"], popularity: 50 },
    { name: "Brian Eno", genres: ["ambient", "electronic", "art rock"], songs: ["Music For Airports", "An Ending", "Deep Blue Day", "By This River", "The Big Ship", "Here Come The Warm Jets", "1/1", "Thursday Afternoon", "Reflection", "Discreet Music"], popularity: 65 },
    { name: "Tycho", genres: ["ambient", "electronic", "chillwave"], songs: ["Awake", "Dive", "A Walk", "See", "Epigram", "Horizon", "Coastal Brake", "Past Is Prologue", "Montana", "Weather"], popularity: 58 },
    { name: "Sigur Rós", genres: ["ambient", "post-rock", "art rock"], songs: ["Hoppípolla", "Svefn-g-englar", "Glósóli", "Starálfur", "Festival", "Gobbledigook", "Ára Bátur", "Vaka", "Olsen Olsen", "Dauðalagið"], popularity: 62 },

    // ─── Funk & Disco ──────────────────────────────────────
    { name: "Jamiroquai", genres: ["funk", "acid jazz", "disco"], songs: ["Virtual Insanity", "Cosmic Girl", "Canned Heat", "Love Foolosophy", "Space Cowboy", "Deeper Underground", "Alright", "Little L", "You Give Me Something", "Cloud 9"], popularity: 68 },
    { name: "Bee Gees", genres: ["disco", "pop", "soft rock"], songs: ["Stayin' Alive", "How Deep Is Your Love", "Night Fever", "More Than A Woman", "Tragedy", "You Should Be Dancing", "Jive Talkin'", "Too Much Heaven", "Lonely Days", "To Love Somebody"], popularity: 78 },
    { name: "Nile Rodgers & CHIC", genres: ["disco", "funk"], songs: ["Le Freak", "Good Times", "I Want Your Love", "Everybody Dance", "Dance Dance Dance", "My Forbidden Lover", "I'll Be There", "At Last I Am Free", "Stage Fright", "My Feet Keep Dancing"], popularity: 65 },
    { name: "Vulfpeck", genres: ["funk", "indie pop"], songs: ["Dean Town", "1612", "Back Pocket", "Wait For The Moment", "Birds Of A Feather", "Cory Wong", "Animal Spirits", "Running Away", "Conscious Club", "Beastly"], popularity: 60 },
    { name: "Anderson .Paak", genres: ["funk", "hip hop", "r&b"], songs: ["Come Down", "Am I Wrong", "Bubblin'", "Tints", "Leave The Door Open", "Make It Better", "Heart Don't Stand A Chance", "Dang!", "Celebrate", "Lockdown"] },

    // ─── World & Afrobeats ─────────────────────────────────
    { name: "Burna Boy", genres: ["afrobeats", "afro-fusion"], songs: ["Last Last", "On The Low", "Ye", "Anybody", "Kilometre", "It's Plenty", "City Boys", "Dangote", "Gbona", "Bank On It"] },
    { name: "Wizkid", genres: ["afrobeats", "afro-pop"], songs: ["Essence", "Ojuelegba", "Come Closer", "Joro", "Soco", "No Stress", "Ginger", "Bad To Me", "Master Groove", "Daddy Yo"] },
    { name: "Tems", genres: ["afrobeats", "r&b", "alternative r&b"], songs: ["Free Mind", "Higher", "Love Me JeJe", "Damages", "Found", "Me & U", "Avoid Things", "Ice T", "Vibe Out", "Not An Angel"] },
    { name: "Fela Kuti", genres: ["afrobeat", "funk", "world"], songs: ["Zombie", "Water No Get Enemy", "Lady", "Gentleman", "Colonial Mentality", "Sorrow Tears and Blood", "Yellow Fever", "Shuffering and Shmiling", "Shakara", "Roforofo Fight"], popularity: 68 },

    // ─── Emo & Screamo ─────────────────────────────────────
    { name: "My Chemical Romance", genres: ["emo", "alternative rock", "pop punk"], songs: ["Welcome To The Black Parade", "Helena", "I'm Not Okay", "Teenagers", "Famous Last Words", "The Ghost Of You", "I Don't Love You", "Na Na Na", "Planetary (GO!)", "Sing"] },
    { name: "Paramore", genres: ["pop rock", "emo", "alternative rock"], songs: ["Decode", "Misery Business", "The Only Exception", "Still Into You", "Hard Times", "This Is Why", "Ain't It Fun", "Ignorance", "crushcrushcrush", "That's What You Get"] },
    { name: "Fall Out Boy", genres: ["pop punk", "emo", "alternative rock"], songs: ["Sugar We're Goin Down", "Thnks fr th Mmrs", "Dance Dance", "Centuries", "My Songs Know What You Did In The Dark", "Uma Thurman", "Immortals", "Save Rock and Roll", "Hold Me Tight", "Alone Together"] },
    { name: "Panic! At The Disco", genres: ["pop rock", "emo", "baroque pop"], songs: ["I Write Sins Not Tragedies", "High Hopes", "Victorious", "House Of Memories", "Emperor's New Clothes", "Nine In The Afternoon", "The Ballad of Mona Lisa", "Death Of A Bachelor", "Hallelujah", "Say Amen"] },

    // ─── R&B Classics ──────────────────────────────────────
    { name: "Whitney Houston", genres: ["r&b", "pop", "soul"], songs: ["I Will Always Love You", "Greatest Love Of All", "I Wanna Dance With Somebody", "How Will I Know", "Saving All My Love For You", "Exhale", "My Love Is Your Love", "I Have Nothing", "Run To You", "It's Not Right But It's Okay"], popularity: 82 },
    { name: "Prince", genres: ["funk", "r&b", "pop rock"], songs: ["Purple Rain", "When Doves Cry", "Kiss", "Little Red Corvette", "1999", "Raspberry Beret", "Let's Go Crazy", "I Would Die 4 U", "Sign O' The Times", "Cream"], popularity: 85 },
    { name: "Michael Jackson", genres: ["pop", "r&b", "funk"], songs: ["Billie Jean", "Thriller", "Beat It", "Smooth Criminal", "Don't Stop 'Til You Get Enough", "Rock With You", "Bad", "Black or White", "The Way You Make Me Feel", "Man In The Mirror", "Wanna Be Startin' Somethin'", "PYT"], popularity: 95 },

    // ─── Contemporary Pop/Alt ──────────────────────────────
    { name: "Lana Del Rey", genres: ["indie pop", "dream pop", "baroque pop"], songs: ["Summertime Sadness", "Young And Beautiful", "Video Games", "Born To Die", "West Coast", "Venice Bitch", "Mariners Apartment Complex", "Ride", "A&W", "Say Yes to Heaven"] },
    { name: "Charli XCX", genres: ["pop", "hyperpop", "electropop"], songs: ["Speed Drive", "360", "Apple", "Von Dutch", "Girl, so confusing", "Boom Clap", "1999", "I Love It", "Good Ones", "Used To Know Me"] },
    { name: "Doja Cat", genres: ["pop", "hip hop", "r&b"], songs: ["Say So", "Kiss Me More", "Woman", "Need To Know", "Streets", "Paint The Town Red", "Agora Hills", "Get Into It", "Best Friend", "Attention"] },
    { name: "Sabrina Carpenter", genres: ["pop", "dance-pop"], songs: ["Espresso", "Please Please Please", "Feather", "Nonsense", "Taste", "Slim Pickins", "Bed Chem", "Because I Liked a Boy", "Fast Times", "Skinny Dipping"] },
    { name: "Chappell Roan", genres: ["pop", "indie pop", "electropop"], songs: ["Good Luck, Babe!", "HOT TO GO!", "Red Wine Supernova", "Femininomenon", "Pink Pony Club", "Casual", "My Kink Is Karma", "After Midnight", "Naked In Manhattan", "Super Graphic Ultra Modern Girl"] },
    { name: "Gracie Abrams", genres: ["indie pop", "singer-songwriter"], songs: ["I Love You, I'm Sorry", "Close To You", "That's So True", "Risk", "21", "Block Me", "Mess It Up", "Rockland", "Fault Line", "Where Do We Go Now?"] },
    { name: "Tate McRae", genres: ["pop", "dance-pop"], songs: ["Greedy", "You Broke Me First", "Exes", "Run For The Hills", "She's All I Wanna Be", "What Would You Do?", "10:35", "It's OK I'm OK", "Cut My Hair", "Slower"] },

    // ─── Grunge & 90s Alt ──────────────────────────────────
    { name: "Pearl Jam", genres: ["grunge", "rock", "alternative rock"], songs: ["Black", "Alive", "Even Flow", "Jeremy", "Yellow Ledbetter", "Better Man", "Last Kiss", "Daughter", "Release", "Just Breathe"], popularity: 78 },
    { name: "Soundgarden", genres: ["grunge", "alternative metal"], songs: ["Black Hole Sun", "Spoonman", "Fell On Black Days", "Rusty Cage", "Outshined", "Burden In My Hand", "The Day I Tried To Live", "My Wave", "Superunknown", "Pretty Noose"], popularity: 72 },
    { name: "Alice In Chains", genres: ["grunge", "alternative metal"], songs: ["Rooster", "Would?", "Man In The Box", "Down In A Hole", "No Excuses", "Them Bones", "Nutshell", "Again", "Rain When I Die", "Dam That River"], popularity: 72 },
    { name: "Smashing Pumpkins", genres: ["alternative rock", "grunge"], songs: ["1979", "Tonight Tonight", "Bullet With Butterfly Wings", "Today", "Disarm", "Zero", "Ava Adore", "Cherub Rock", "Mayonaise", "Rhinoceros"], popularity: 70 },

    // ─── Garage / Surf Rock ────────────────────────────────
    { name: "The Black Keys", genres: ["garage rock", "blues rock"], songs: ["Lonely Boy", "Gold On The Ceiling", "Tighten Up", "Howlin' For You", "Little Black Submarines", "Fever", "Weight of Love", "Turn Blue", "Beautiful People", "Wild Child"] },
    { name: "The White Stripes", genres: ["garage rock", "blues rock"], songs: ["Seven Nation Army", "Fell In Love With A Girl", "Icky Thump", "Blue Orchid", "My Doorbell", "Dead Leaves And The Dirty Ground", "Hardest Button To Button", "Ball And Biscuit", "Hotel Yorba", "We're Going To Be Friends"] },

    // ─── Singer-Songwriter Modern ──────────────────────────
    { name: "Weyes Blood", genres: ["indie pop", "art pop", "dream pop"], songs: ["Everyday", "Movies", "God Turn Me Into A Flower", "It's Not Just Me, It's Everybody", "Andromeda", "Something To Believe", "A Lot's Gonna Change", "Do You Need My Love", "Wild Time", "Hearts Aglow"] },
    { name: "Sufjan Stevens", genres: ["indie folk", "singer-songwriter", "art pop"], songs: ["Mystery of Love", "Chicago", "Should Have Known Better", "Fourth of July", "Casimir Pulaski Day", "John My Beloved", "Death With Dignity", "Will Anybody Ever Love Me?", "Predatory Wasp", "The Only Thing"] },
    { name: "Father John Misty", genres: ["indie folk", "folk rock", "singer-songwriter"], songs: ["Real Love Baby", "Hollywood Forever Cemetery Sings", "I Love You Honeybear", "Chateau Lobby #4", "Funny Girl", "Goodbye Mr. Blue", "Pure Comedy", "Nancy From Now On", "God's Favorite Customer", "Total Entertainment Forever"] },
];
