/* ========================================
   TikTok Clone - App JavaScript
   ======================================== */

(function () {
    'use strict';

    // ========================================
    // Video Data
    // ========================================
    const videoData = [
        {
            id: 1,
            username: '@chef_marco',
            displayName: 'Chef Marco',
            description: 'Secret pasta trick that Italian grandmas don\'t want you to know! #cooking #pasta #foodtok #italianfood',
            music: 'That\'s Amore - Dean Martin',
            likes: 284300,
            comments: 4521,
            bookmarks: 18200,
            shares: 12400,
            emoji: '\uD83C\uDF5D',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            avatar: 'CM',
            avatarColor: '#667eea',
            commentList: [
                { user: '@foodie_anna', text: 'OMG tried this and it actually works!!!', likes: 342, time: '2h' },
                { user: '@pasta_lover', text: 'My nonna does this every Sunday', likes: 128, time: '3h' },
                { user: '@gordon_fan', text: 'Better than anything on cooking shows', likes: 89, time: '4h' },
                { user: '@kitchen_queen', text: 'Adding this to my recipe collection', likes: 56, time: '5h' },
            ]
        },
        {
            id: 2,
            username: '@dance_vibes',
            displayName: 'Dance Vibes',
            description: 'New choreo drop! Who can hit every beat? \uD83D\uDD25 #dance #choreography #viral #foryou',
            music: 'Original Sound - dance_vibes',
            likes: 892100,
            comments: 15600,
            bookmarks: 45300,
            shares: 67800,
            emoji: '\uD83D\uDC83',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            avatar: 'DV',
            avatarColor: '#f5576c',
            commentList: [
                { user: '@dancer_99', text: 'THE FOOTWORK IS INSANE', likes: 2341, time: '1h' },
                { user: '@hip_hop_head', text: 'Tutorial please!!', likes: 892, time: '2h' },
                { user: '@move_maker', text: 'I\'ve watched this 50 times and still can\'t do it', likes: 445, time: '3h' },
            ]
        },
        {
            id: 3,
            username: '@astro_nerd',
            displayName: 'Space Facts',
            description: 'Did you know a day on Venus is longer than a year on Venus? \uD83E\uDD2F #space #science #mindblown #facts',
            music: 'Interstellar Theme - Hans Zimmer',
            likes: 543200,
            comments: 8900,
            bookmarks: 67100,
            shares: 34500,
            emoji: '\uD83C\uDF0C',
            gradient: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
            avatar: 'SF',
            avatarColor: '#0c3483',
            commentList: [
                { user: '@science_geek', text: 'My brain just exploded', likes: 1523, time: '30m' },
                { user: '@nasa_fan', text: 'Venus is literally built different', likes: 678, time: '1h' },
                { user: '@curious_mind', text: 'More space facts please!', likes: 234, time: '2h' },
                { user: '@student_life', text: 'Using this in my presentation tomorrow', likes: 189, time: '3h' },
                { user: '@teacher_tom', text: 'I show these to my class every week', likes: 456, time: '4h' },
            ]
        },
        {
            id: 4,
            username: '@cute_pets',
            displayName: 'Cute Pets Daily',
            description: 'When your cat discovers the mirror for the first time \uD83D\uDE02\uD83D\uDE3B #cats #funny #pets #catsoftiktok',
            music: 'Funny Song - Cavendish Music',
            likes: 1200000,
            comments: 23400,
            bookmarks: 89200,
            shares: 156000,
            emoji: '\uD83D\uDE3B',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            avatar: 'CP',
            avatarColor: '#fa709a',
            commentList: [
                { user: '@cat_mom', text: 'My cat does this EVERY DAY \uD83D\uDE02', likes: 5623, time: '45m' },
                { user: '@pet_lover', text: 'I can\'t stop laughing', likes: 2341, time: '1h' },
                { user: '@animal_world', text: 'Cats are actually so smart', likes: 891, time: '2h' },
            ]
        },
        {
            id: 5,
            username: '@fitness_king',
            displayName: 'Fitness King',
            description: '5 exercises you can do at your desk. No excuses! \uD83D\uDCAA #fitness #workout #health #motivation #gym',
            music: 'Eye of the Tiger - Survivor',
            likes: 367800,
            comments: 6700,
            bookmarks: 124000,
            shares: 45600,
            emoji: '\uD83D\uDCAA',
            gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            avatar: 'FK',
            avatarColor: '#11998e',
            commentList: [
                { user: '@office_worker', text: 'My coworkers think I\'m crazy but it works', likes: 892, time: '1h' },
                { user: '@gym_rat', text: 'Adding these to my routine', likes: 445, time: '2h' },
                { user: '@health_nut', text: 'Finally something I can do without equipment!', likes: 334, time: '3h' },
                { user: '@lazy_fit', text: 'The desk push-up is genius', likes: 223, time: '4h' },
            ]
        },
        {
            id: 6,
            username: '@art_magic',
            displayName: 'Art Magic',
            description: 'Turning a random scribble into a masterpiece \uD83C\uDFA8 Watch till the end! #art #drawing #satisfying',
            music: 'Clair de Lune - Debussy',
            likes: 678900,
            comments: 11200,
            bookmarks: 234000,
            shares: 89100,
            emoji: '\uD83C\uDFA8',
            gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
            avatar: 'AM',
            avatarColor: '#f5af19',
            commentList: [
                { user: '@art_lover', text: 'HOW??? This is pure talent', likes: 3456, time: '2h' },
                { user: '@creative_soul', text: 'I need a full tutorial', likes: 1234, time: '3h' },
                { user: '@painter_pete', text: 'The transition at 0:15 is *chef\'s kiss*', likes: 678, time: '4h' },
            ]
        },
        {
            id: 7,
            username: '@comedy_central',
            displayName: 'Comedy Central',
            description: 'POV: You\'re explaining to your parents what you do for a living \uD83D\uDE02 #comedy #relatable #funny #pov',
            music: 'Original Sound - comedy_central',
            likes: 2100000,
            comments: 45600,
            bookmarks: 67800,
            shares: 234000,
            emoji: '\uD83D\uDE02',
            gradient: 'linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)',
            avatar: 'CC',
            avatarColor: '#7F00FF',
            commentList: [
                { user: '@millennial', text: 'I\'m in this video and I don\'t like it', likes: 8923, time: '30m' },
                { user: '@gen_z_humor', text: 'Literally had this conversation yesterday', likes: 4567, time: '1h' },
                { user: '@dad_jokes', text: '"So you make videos on the internet?" - My dad, every holiday', likes: 3456, time: '2h' },
            ]
        },
        {
            id: 8,
            username: '@travel_with_me',
            displayName: 'Travel Guide',
            description: 'Hidden gem in Bali that NOBODY talks about \uD83C\uDF34 Save this for later! #travel #bali #hidden #paradise',
            music: 'Island In The Sun - Weezer',
            likes: 456700,
            comments: 7800,
            bookmarks: 345000,
            shares: 123000,
            emoji: '\uD83C\uDF34',
            gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
            avatar: 'TG',
            avatarColor: '#2193b0',
            commentList: [
                { user: '@wanderlust', text: 'Adding to my bucket list RIGHT NOW', likes: 2345, time: '1h' },
                { user: '@backpacker', text: 'I was there last month! It\'s even better in person', likes: 1234, time: '2h' },
                { user: '@travel_bug', text: 'How much did this trip cost roughly?', likes: 567, time: '3h' },
            ]
        },
        {
            id: 9,
            username: '@gaming_pro',
            displayName: 'Gaming Pro',
            description: 'This 1v5 clutch made my teammates lose their minds \uD83C\uDFAE #gaming #clutch #esports #viral',
            music: 'Original Sound - gaming_pro',
            likes: 987600,
            comments: 19800,
            bookmarks: 56700,
            shares: 78900,
            emoji: '\uD83C\uDFAE',
            gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
            avatar: 'GP',
            avatarColor: '#0072ff',
            commentList: [
                { user: '@gamer_girl', text: 'THE FLICK AT THE END WAS INSANE', likes: 5678, time: '45m' },
                { user: '@esports_fan', text: 'Sign this person immediately', likes: 3456, time: '1h' },
                { user: '@noob_player', text: 'Meanwhile I can\'t even win a 1v1', likes: 2345, time: '2h' },
            ]
        },
        {
            id: 10,
            username: '@diy_queen',
            displayName: 'DIY Queen',
            description: 'Turned $5 of supplies into this amazing room decor \u2728 #diy #homedecor #budget #craft #roomtour',
            music: 'Good as Hell - Lizzo',
            likes: 534200,
            comments: 9100,
            bookmarks: 267000,
            shares: 67800,
            emoji: '\u2728',
            gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
            avatar: 'DQ',
            avatarColor: '#c471f5',
            commentList: [
                { user: '@craft_lover', text: 'Where did you get the supplies??', likes: 1234, time: '1h' },
                { user: '@budget_home', text: 'This looks like something from a $200 store', likes: 890, time: '2h' },
                { user: '@room_inspo', text: 'Saving this for my room makeover', likes: 567, time: '3h' },
            ]
        },
    ];

    // ========================================
    // State
    // ========================================
    let currentIndex = 0;
    let isAnimating = false;
    let touchStartY = 0;
    let touchDeltaY = 0;
    let lastTapTime = 0;
    let progressInterval = null;
    let likedVideos = new Set();
    let bookmarkedVideos = new Set();

    // ========================================
    // DOM Elements
    // ========================================
    const videoFeed = document.getElementById('videoFeed');
    const videoSidebar = document.getElementById('videoSidebar');
    const videoInfo = document.getElementById('videoInfo');
    const likeBtn = document.getElementById('likeBtn');
    const commentBtn = document.getElementById('commentBtn');
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const shareBtn = document.getElementById('shareBtn');
    const commentsPanel = document.getElementById('commentsPanel');
    const commentsClose = document.getElementById('commentsClose');
    const commentsList = document.getElementById('commentsList');
    const commentsInput = document.getElementById('commentsInput');
    const commentsSend = document.getElementById('commentsSend');
    const commentsTotalCount = document.getElementById('commentsTotalCount');
    const sharePanel = document.getElementById('sharePanel');
    const shareClose = document.getElementById('shareClose');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const overlay = document.getElementById('overlay');
    const toast = document.getElementById('toast');
    const playIndicator = document.getElementById('playIndicator');
    const musicDisc = document.getElementById('musicDisc');
    const bottomNav = document.querySelector('.bottom-nav');

    // ========================================
    // Format numbers
    // ========================================
    function formatCount(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    // ========================================
    // Create video slides
    // ========================================
    function createVideoSlides() {
        videoFeed.innerHTML = '';
        videoData.forEach((video, index) => {
            const slide = document.createElement('div');
            slide.className = 'video-slide';
            slide.dataset.index = index;
            slide.style.transform = `translateY(${(index - currentIndex) * 100}%)`;

            // Create particles
            let particlesHtml = '';
            for (let i = 0; i < 12; i++) {
                const size = Math.random() * 8 + 3;
                const left = Math.random() * 100;
                const delay = Math.random() * 8;
                const duration = Math.random() * 6 + 6;
                const hue = Math.random() * 60 - 30;
                particlesHtml += `<div class="particle" style="
                    width:${size}px;height:${size}px;
                    left:${left}%;
                    background:hsla(${hue + 200},80%,70%,0.6);
                    animation-delay:${delay}s;
                    animation-duration:${duration}s;
                "></div>`;
            }

            slide.innerHTML = `
                <div class="video-canvas" style="background:${video.gradient}">
                    <div class="video-particles">${particlesHtml}</div>
                    <div class="video-gradient" style="background:radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%)"></div>
                    <div class="video-bg-pattern">
                        <div class="video-emoji">${video.emoji}</div>
                    </div>
                </div>
                <div class="video-progress">
                    <div class="video-progress-bar"></div>
                </div>
            `;

            videoFeed.appendChild(slide);
        });
    }

    // ========================================
    // Update UI for current video
    // ========================================
    function updateVideoUI() {
        const video = videoData[currentIndex];

        // Username
        document.getElementById('videoUsername').textContent = video.username;

        // Description
        document.getElementById('descText').textContent = video.description;

        // Music
        document.getElementById('musicName').textContent = video.music + '  \u266A  ' + video.music + '  \u266A  ';

        // Avatar
        const avatarImg = document.getElementById('avatarImg');
        avatarImg.style.display = 'none';
        const avatar = document.getElementById('currentAvatar');
        avatar.style.background = video.avatarColor;
        avatar.innerHTML = `<span style="color:white;font-size:16px;font-weight:700">${video.avatar}</span>`;

        // Like
        const likeIcon = likeBtn.querySelector('.like-icon');
        if (likedVideos.has(video.id)) {
            likeIcon.classList.add('liked');
        } else {
            likeIcon.classList.remove('liked');
        }
        document.getElementById('likeCount').textContent = formatCount(
            video.likes + (likedVideos.has(video.id) ? 1 : 0)
        );

        // Comments
        document.getElementById('commentCount').textContent = formatCount(video.comments);

        // Bookmarks
        const bookmarkIcon = bookmarkBtn.querySelector('.sidebar-icon');
        if (bookmarkedVideos.has(video.id)) {
            bookmarkIcon.querySelector('svg path').setAttribute('fill', '#ffc107');
            bookmarkIcon.querySelector('svg path').setAttribute('stroke', '#ffc107');
        } else {
            bookmarkIcon.querySelector('svg path').setAttribute('fill', 'none');
            bookmarkIcon.querySelector('svg path').setAttribute('stroke', 'white');
        }
        document.getElementById('bookmarkCount').textContent = formatCount(
            video.bookmarks + (bookmarkedVideos.has(video.id) ? 1 : 0)
        );

        // Shares
        document.getElementById('shareCount').textContent = formatCount(video.shares);

        // Start progress animation
        startProgress();
    }

    // ========================================
    // Progress bar simulation
    // ========================================
    function startProgress() {
        if (progressInterval) clearInterval(progressInterval);
        const progressBar = document.querySelector(`.video-slide[data-index="${currentIndex}"] .video-progress-bar`);
        if (!progressBar) return;

        let width = 0;
        progressBar.style.width = '0%';

        progressInterval = setInterval(() => {
            width += 0.15;
            if (width >= 100) width = 0;
            progressBar.style.width = width + '%';
        }, 50);
    }

    // ========================================
    // Navigate to video
    // ========================================
    function goToVideo(index) {
        if (index < 0 || index >= videoData.length || isAnimating) return;
        isAnimating = true;
        currentIndex = index;

        const slides = document.querySelectorAll('.video-slide');
        slides.forEach((slide, i) => {
            slide.style.transform = `translateY(${(i - currentIndex) * 100}%)`;
        });

        updateVideoUI();

        setTimeout(() => {
            isAnimating = false;
        }, 400);
    }

    // ========================================
    // Touch / Swipe handling
    // ========================================
    function handleTouchStart(e) {
        if (commentsPanel.classList.contains('open') || sharePanel.classList.contains('open')) return;
        touchStartY = e.touches[0].clientY;
        touchDeltaY = 0;
    }

    function handleTouchMove(e) {
        if (commentsPanel.classList.contains('open') || sharePanel.classList.contains('open')) return;
        touchDeltaY = e.touches[0].clientY - touchStartY;

        // Allow slight visual feedback
        const slides = document.querySelectorAll('.video-slide');
        slides.forEach((slide, i) => {
            const offset = (i - currentIndex) * 100;
            const dragOffset = (touchDeltaY / window.innerHeight) * 100;
            slide.style.transition = 'none';
            slide.style.transform = `translateY(${offset + dragOffset}%)`;
        });
    }

    function handleTouchEnd(e) {
        if (commentsPanel.classList.contains('open') || sharePanel.classList.contains('open')) return;

        // Restore transitions
        const slides = document.querySelectorAll('.video-slide');
        slides.forEach(slide => {
            slide.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });

        const threshold = window.innerHeight * 0.15;

        if (touchDeltaY < -threshold && currentIndex < videoData.length - 1) {
            goToVideo(currentIndex + 1);
        } else if (touchDeltaY > threshold && currentIndex > 0) {
            goToVideo(currentIndex - 1);
        } else {
            // Snap back
            slides.forEach((slide, i) => {
                slide.style.transform = `translateY(${(i - currentIndex) * 100}%)`;
            });
        }
    }

    // ========================================
    // Mouse wheel handling (desktop)
    // ========================================
    let wheelTimeout = null;
    function handleWheel(e) {
        if (commentsPanel.classList.contains('open') || sharePanel.classList.contains('open')) return;
        e.preventDefault();

        if (wheelTimeout) return;

        if (e.deltaY > 30 && currentIndex < videoData.length - 1) {
            goToVideo(currentIndex + 1);
        } else if (e.deltaY < -30 && currentIndex > 0) {
            goToVideo(currentIndex - 1);
        }

        wheelTimeout = setTimeout(() => {
            wheelTimeout = null;
        }, 500);
    }

    // ========================================
    // Keyboard handling
    // ========================================
    function handleKeyDown(e) {
        if (commentsPanel.classList.contains('open') || sharePanel.classList.contains('open')) {
            if (e.key === 'Escape') {
                closeAllPanels();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
            case 'j':
                e.preventDefault();
                if (currentIndex < videoData.length - 1) goToVideo(currentIndex + 1);
                break;
            case 'ArrowUp':
            case 'k':
                e.preventDefault();
                if (currentIndex > 0) goToVideo(currentIndex - 1);
                break;
            case 'l':
                toggleLike();
                break;
            case 'c':
                openComments();
                break;
            case 's':
                toggleBookmark();
                break;
        }
    }

    // ========================================
    // Double tap to like
    // ========================================
    function handleDoubleTap(e) {
        const now = Date.now();
        if (now - lastTapTime < 350) {
            // Double tap detected
            if (!likedVideos.has(videoData[currentIndex].id)) {
                toggleLike();
            }
            showDoubleTapHeart(e);
        }
        lastTapTime = now;
    }

    function showDoubleTapHeart(e) {
        const heart = document.createElement('div');
        heart.className = 'double-tap-heart';

        const x = e.clientX || e.touches?.[0]?.clientX || window.innerWidth / 2;
        const y = e.clientY || e.touches?.[0]?.clientY || window.innerHeight / 2;

        heart.style.left = (x - 50) + 'px';
        heart.style.top = (y - 50) + 'px';
        heart.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 900);
    }

    // ========================================
    // Like
    // ========================================
    function toggleLike() {
        const video = videoData[currentIndex];
        const likeIcon = likeBtn.querySelector('.like-icon');

        if (likedVideos.has(video.id)) {
            likedVideos.delete(video.id);
            likeIcon.classList.remove('liked');
        } else {
            likedVideos.add(video.id);
            likeIcon.classList.add('liked');
        }

        document.getElementById('likeCount').textContent = formatCount(
            video.likes + (likedVideos.has(video.id) ? 1 : 0)
        );
    }

    // ========================================
    // Bookmark
    // ========================================
    function toggleBookmark() {
        const video = videoData[currentIndex];
        const bookmarkIcon = bookmarkBtn.querySelector('.sidebar-icon');

        if (bookmarkedVideos.has(video.id)) {
            bookmarkedVideos.delete(video.id);
            bookmarkIcon.querySelector('svg path').setAttribute('fill', 'none');
            bookmarkIcon.querySelector('svg path').setAttribute('stroke', 'white');
            showToast('Removed from bookmarks');
        } else {
            bookmarkedVideos.add(video.id);
            bookmarkIcon.querySelector('svg path').setAttribute('fill', '#ffc107');
            bookmarkIcon.querySelector('svg path').setAttribute('stroke', '#ffc107');
            showToast('Saved to bookmarks');
        }

        document.getElementById('bookmarkCount').textContent = formatCount(
            video.bookmarks + (bookmarkedVideos.has(video.id) ? 1 : 0)
        );
    }

    // ========================================
    // Comments
    // ========================================
    function openComments() {
        const video = videoData[currentIndex];
        commentsTotalCount.textContent = formatCount(video.comments) + ' comments';

        commentsList.innerHTML = video.commentList.map(comment => `
            <div class="comment-item">
                <div class="comment-avatar">${comment.user.charAt(1).toUpperCase()}</div>
                <div class="comment-content">
                    <div class="comment-username">${comment.user}</div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        <span>${comment.time}</span>
                        <button class="comment-like-btn" onclick="this.classList.toggle('liked')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            ${formatCount(comment.likes)}
                        </button>
                        <span style="cursor:pointer">Reply</span>
                    </div>
                </div>
            </div>
        `).join('');

        commentsPanel.classList.add('open');
        overlay.classList.add('visible');
    }

    function closeComments() {
        commentsPanel.classList.remove('open');
        overlay.classList.remove('visible');
    }

    function addComment() {
        const text = commentsInput.value.trim();
        if (!text) return;

        const commentHtml = `
            <div class="comment-item" style="animation: slideInUp 0.3s ease">
                <div class="comment-avatar">Y</div>
                <div class="comment-content">
                    <div class="comment-username">@you</div>
                    <div class="comment-text">${text}</div>
                    <div class="comment-actions">
                        <span>now</span>
                        <button class="comment-like-btn" onclick="this.classList.toggle('liked')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            0
                        </button>
                        <span style="cursor:pointer">Reply</span>
                    </div>
                </div>
            </div>
        `;

        commentsList.insertAdjacentHTML('afterbegin', commentHtml);
        commentsInput.value = '';

        // Update count
        videoData[currentIndex].comments++;
        document.getElementById('commentCount').textContent = formatCount(videoData[currentIndex].comments);
        commentsTotalCount.textContent = formatCount(videoData[currentIndex].comments) + ' comments';
    }

    // ========================================
    // Share
    // ========================================
    function openShare() {
        sharePanel.classList.add('open');
        overlay.classList.add('visible');
    }

    function closeShare() {
        sharePanel.classList.remove('open');
        overlay.classList.remove('visible');
    }

    // ========================================
    // Close all panels
    // ========================================
    function closeAllPanels() {
        closeComments();
        closeShare();
    }

    // ========================================
    // Toast notification
    // ========================================
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // ========================================
    // Bottom navigation
    // ========================================
    function setupBottomNav() {
        const navItems = document.querySelectorAll('.nav-item');
        const pages = {
            home: null,
            discover: document.getElementById('discoverPage'),
            upload: document.getElementById('uploadPage'),
            inbox: document.getElementById('inboxPage'),
            profile: document.getElementById('profilePage'),
        };

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;

                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                // Hide all pages
                Object.values(pages).forEach(p => {
                    if (p) p.classList.remove('active');
                });

                // Show/hide video elements
                if (page === 'home') {
                    videoFeed.style.display = '';
                    videoSidebar.style.display = '';
                    videoInfo.style.display = '';
                    document.querySelector('.top-nav').style.display = '';
                } else {
                    videoFeed.style.display = 'none';
                    videoSidebar.style.display = 'none';
                    videoInfo.style.display = 'none';
                    document.querySelector('.top-nav').style.display = 'none';

                    if (pages[page]) {
                        pages[page].classList.add('active');
                    }
                }
            });
        });
    }

    // ========================================
    // Discover page
    // ========================================
    function setupDiscoverPage() {
        const grid = document.getElementById('discoverGrid');
        const discoverVideos = videoData.slice().sort(() => Math.random() - 0.5);

        grid.innerHTML = discoverVideos.map(video => `
            <div class="discover-item">
                <div class="discover-bg" style="background:${video.gradient}">${video.emoji}</div>
                <div class="discover-overlay">
                    <div class="discover-views">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                        ${formatCount(video.likes)}
                    </div>
                    <div class="discover-desc">${video.description}</div>
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // Inbox page
    // ========================================
    function setupInboxPage() {
        const inboxList = document.getElementById('inboxList');
        const notifications = [
            { icon: '\u2764\uFE0F', name: 'chef_marco', preview: 'liked your comment', time: '2m', unread: true },
            { icon: '\uD83D\uDCAC', name: 'dance_vibes', preview: 'replied to your comment: "Thank you!"', time: '15m', unread: true },
            { icon: '\uD83D\uDC64', name: 'astro_nerd', preview: 'started following you', time: '1h', unread: true },
            { icon: '\u2764\uFE0F', name: 'cute_pets', preview: 'liked your video', time: '2h', unread: false },
            { icon: '\uD83D\uDD14', name: 'TikTok', preview: 'Your video is trending! It has 10K views', time: '3h', unread: false },
            { icon: '\uD83D\uDCAC', name: 'fitness_king', preview: 'commented: "Great content!"', time: '5h', unread: false },
            { icon: '\uD83D\uDC64', name: 'art_magic', preview: 'started following you', time: '8h', unread: false },
            { icon: '\u2764\uFE0F', name: 'comedy_central', preview: 'liked your comment', time: '1d', unread: false },
        ];

        inboxList.innerHTML = notifications.map(n => `
            <div class="inbox-item">
                <div class="inbox-avatar">${n.icon}</div>
                <div class="inbox-content">
                    <div class="inbox-name">${n.name}</div>
                    <div class="inbox-preview">${n.preview}</div>
                </div>
                <span class="inbox-time">${n.time}</span>
                ${n.unread ? '<div class="inbox-dot"></div>' : ''}
            </div>
        `).join('');
    }

    // ========================================
    // Profile page
    // ========================================
    function setupProfilePage() {
        const grid = document.getElementById('profileVideoGrid');
        const myVideos = videoData.slice(0, 6);

        grid.innerHTML = myVideos.map(video => `
            <div class="profile-video-item">
                <div class="profile-video-bg" style="background:${video.gradient}">${video.emoji}</div>
                <div class="profile-video-views">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                    ${formatCount(video.likes)}
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // Tab switching (Following / For You)
    // ========================================
    function setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                if (tab.dataset.tab === 'following') {
                    showToast('Following feed');
                } else {
                    showToast('For You feed');
                }
            });
        });
    }

    // ========================================
    // Play/pause toggle on tap
    // ========================================
    let isPaused = false;

    function togglePlayPause() {
        isPaused = !isPaused;

        if (isPaused) {
            musicDisc.classList.add('paused');
            if (progressInterval) clearInterval(progressInterval);
            showPlayIndicator('pause');
        } else {
            musicDisc.classList.remove('paused');
            startProgress();
            showPlayIndicator('play');
        }
    }

    function showPlayIndicator(type) {
        const indicator = document.getElementById('playIndicator');
        if (type === 'pause') {
            indicator.innerHTML = `<svg width="80" height="80" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>`;
        } else {
            indicator.innerHTML = `<svg width="80" height="80" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
                <polygon points="5,3 19,12 5,21"/>
            </svg>`;
        }
        indicator.classList.remove('show');
        void indicator.offsetWidth;
        indicator.classList.add('show');
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        createVideoSlides();
        updateVideoUI();
        setupBottomNav();
        setupDiscoverPage();
        setupInboxPage();
        setupProfilePage();
        setupTabs();

        // Touch events
        videoFeed.addEventListener('touchstart', handleTouchStart, { passive: true });
        videoFeed.addEventListener('touchmove', handleTouchMove, { passive: false });
        videoFeed.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Wheel event
        videoFeed.addEventListener('wheel', handleWheel, { passive: false });

        // Click/tap on video feed
        videoFeed.addEventListener('click', (e) => {
            handleDoubleTap(e);
        });

        // Single tap to pause (delayed to check for double tap)
        let singleTapTimer = null;
        videoFeed.addEventListener('click', (e) => {
            if (singleTapTimer) clearTimeout(singleTapTimer);
            singleTapTimer = setTimeout(() => {
                const now = Date.now();
                if (now - lastTapTime > 400) {
                    togglePlayPause();
                }
            }, 360);
        });

        // Keyboard
        document.addEventListener('keydown', handleKeyDown);

        // Sidebar buttons
        likeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleLike(); });
        commentBtn.addEventListener('click', (e) => { e.stopPropagation(); openComments(); });
        bookmarkBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleBookmark(); });
        shareBtn.addEventListener('click', (e) => { e.stopPropagation(); openShare(); });

        // Comments panel
        commentsClose.addEventListener('click', closeComments);
        commentsSend.addEventListener('click', addComment);
        commentsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addComment();
        });

        // Share panel
        shareClose.addEventListener('click', closeShare);
        copyLinkBtn.addEventListener('click', () => {
            showToast('Link copied!');
            closeShare();
        });

        // Overlay closes panels
        overlay.addEventListener('click', closeAllPanels);

        // See more button
        document.getElementById('seeMoreBtn').addEventListener('click', () => {
            document.getElementById('videoDescription').classList.toggle('expanded');
        });

        // Profile tabs
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    // Start the app
    init();
})();
