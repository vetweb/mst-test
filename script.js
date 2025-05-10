
let modalManager;

/**
 * Управляет классом хедера при скролле страницы
 * @param {string} headerSelector - Селектор элемента хедера
 * @param {string} activeClass - Класс, добавляемый при скролле
 */
function initScrollHeader(headerSelector = '.js-header', activeClass = 'scrolled') {
    // Проверка необходимых параметров
    if (typeof headerSelector !== 'string' || typeof activeClass !== 'string') {
        console.error('Invalid parameters: headerSelector and activeClass must be strings');
        return;
    }

    const header = document.querySelector(headerSelector);

    // Проверка существования элемента
    if (!header) {
        console.error(`Element with selector "${headerSelector}" not found`);
        return;
    }

    let lastScrollPosition = 0;
    const scrollThreshold = 5; // Порог в пикселях для избежания лишних вычислений

    /**
     * Обработчик события скролла
     */
    function handleScroll() {
        const currentScrollPosition = getCurrentScrollPosition();

        // Оптимизация: проверяем, достаточно ли проскроллили
        if (Math.abs(currentScrollPosition - lastScrollPosition) < scrollThreshold) {
            return;
        }

        if (currentScrollPosition > 0) {
            addHeaderClass();
        } else {
            removeHeaderClass();
        }

        lastScrollPosition = currentScrollPosition;
    }

    /**
     * Получает текущую позицию скролла
     * @returns {number} Позиция скролла в пикселях
     */
    function getCurrentScrollPosition() {
        return window.pageYOffset || document.documentElement.scrollTop;
    }

    /**
     * Добавляет класс к хедеру
     */
    function addHeaderClass() {
        if (!header.classList.contains(activeClass)) {
            header.classList.add(activeClass);
        }
    }

    /**
     * Удаляет класс у хедера
     */
    function removeHeaderClass() {
        if (header.classList.contains(activeClass)) {
            header.classList.remove(activeClass);
        }
    }

    // Добавляем обработчик с debounce для оптимизации
    const debouncedScrollHandler = debounce(handleScroll, 50);
    window.addEventListener('scroll', debouncedScrollHandler);

    // Инициализация при загрузке
    handleScroll();
}

/**
 * Функция для debounce (уменьшения количества вызовов)
 * @param {Function} func - Функция для выполнения
 * @param {number} wait - Время задержки в мс
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Инициализирует маску телефона
 * @param {HTMLFormElement} form
 */
function initMasks(form) {
    const telInput = form.querySelector('.js-tel-mask');

    if (!telInput) return;

    let previousValue = '';

    telInput.addEventListener('input', function () {
        const digits = this.value.replace(/\D/g, '');
        const x = digits.match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);

        let newValue = '';
        if (x[1]) newValue = '+' + x[1];
        if (x[2]) newValue += ' (' + x[2];
        if (x[3]) newValue += ') ' + x[3];
        if (x[4]) newValue += '-' + x[4];
        if (x[5]) newValue += '-' + x[5];

        // Не больше 11 цифр
        if (digits.length > 11) {
            this.value = previousValue;
            return;
        }

        this.value = newValue;
        previousValue = newValue;
    });

    telInput.addEventListener('keydown', function (e) {
        const allowed =
            [46, 8, 9, 27, 13].includes(e.keyCode) || // control keys
            (e.ctrlKey && [65, 67, 88].includes(e.keyCode)) || // ctrl + A/C/X
            (e.keyCode >= 35 && e.keyCode <= 39); // arrows

        const isDigit = (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);

        if (!allowed && !isDigit) {
            e.preventDefault();
        }
    });

    telInput.addEventListener('blur', function () {
        if (this.value === '+') {
            this.value = '';
        }
    });
}

/**
 * Инициализирует поведение лейблов
 * @param {HTMLFormElement} form
 */
function initInputLabels(form) {
    const fields = form.querySelectorAll('.form__field');

    fields.forEach(field => {
        const input = field.querySelector('.form__input');
        const label = field.querySelector('.form__label');
        const error = field.querySelector('.form__error');

        if (!input || !label) return;

        if (input.value.trim()) {
            label.classList.add('form__label--up');
            input.classList.add('form__input--filled');
        }

        input.addEventListener('focus', () => {
            label.classList.add('form__label--up');
            input.classList.add('form__input--active');
            input.classList.remove('form__input--error');
            if (error) error.style.display = 'none';
        });

        input.addEventListener('blur', () => {
            input.classList.remove('form__input--active');
            if (!input.value.trim()) {
                input.classList.remove('form__input--filled');
                label.classList.remove('form__label--up');
            }
        });

        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.classList.add('form__input--filled');
                label.classList.add('form__label--up');
            } else {
                input.classList.remove('form__input--filled');
                label.classList.remove('form__label--up');
            }

            if (input.classList.contains('js-required')) {
                input.classList.remove('form__input--error');
                if (error) error.style.display = 'none';
            }
        });

        label.addEventListener('click', () => {
            input.focus();
        });
    });
}

/**
 * Инициализирует валидацию в реальном времени
 * @param {HTMLFormElement} form
 */
function initValidation(form) {
    const fields = form.querySelectorAll('.form__input');

    fields.forEach(field => {
        field.addEventListener('input', () => {
            if (field.classList.contains('js-required') && !field.value.trim()) {
                field.classList.add('form__input--error');
            } else {
                field.classList.remove('form__input--error');
            }
        });
    });
}

/**
 * Проверяет валидность формы
 * @param {HTMLFormElement} form
 * @returns {boolean}
 */
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('.js-required');

    requiredFields.forEach(field => {
        const isCheckbox = field.type === 'checkbox';
        const fieldWrapper = field.closest('.form__field') || field.closest('.custom-checkbox');
        const error = fieldWrapper?.querySelector('.form__error');

        const hasValue = isCheckbox ? field.checked : field.value.trim();

        if (!hasValue) {
            isValid = false;

            if (isCheckbox) {
                fieldWrapper.classList.add('custom-checkbox--error');
            } else {
                field.classList.add('form__input--error');
            }

            if (error) error.style.display = 'block';
        } else {
            if (isCheckbox) {
                fieldWrapper.classList.remove('custom-checkbox--error');
            } else {
                field.classList.remove('form__input--error');
            }

            if (error) error.style.display = 'none';
        }

        // Спец. проверка маски телефона
        if (field.classList.contains('js-tel-mask')) {
            const digits = field.value.replace(/\D/g, '');
            if (digits.length < 11) {
                field.classList.add('form__input--error');
                if (error) error.style.display = 'block';
                isValid = false;
            }
        }
    });

    return isValid;
}

/**
 * Обработка отправки формы
 * @param {HTMLFormElement} form
 */
function handleFormSubmit(form) {
    console.log('form',form)
    const formData = new FormData(form);
    submitForm(form, formData);
}

/**
 * Отправка формы
 * @param {HTMLFormElement} form
 * @param {FormData} formData
 */
function submitForm(form, formData) {
    openSuccessModal();
    form.reset();
    // resetCustomSelects(form); // если используется

    // fetch(form.action, {
    //     method: 'POST',
    //     body: formData
    // })
    //     .then(res => res.json())
    //     .then(data => {
    //         if (data.success) {
    //             openSuccessModal();
    //             form.reset();
    //         } else {
    //             alert(data.message || 'Ошибка отправки');
    //         }
    //     })
    //     .catch(err => {
    //         console.error('Ошибка:', err);
    //         alert('Ошибка сети');
    //     });
}
function openSuccessModal() {
    const modalId = 'exampleModal';
    const fakeTrigger = document.createElement('button');
    fakeTrigger.setAttribute('data-close-menu', 'false');
    modalManager.openModal(modalId, fakeTrigger);
}

/**
 * Инициализирует поведение формы
 * @param {HTMLFormElement} form
 */
function initForm(form) {
    initMasks(form);
    initInputLabels(form);
    initValidation(form);

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (validateForm(form)) {
            handleFormSubmit(form);
        }
    });
}


/**
 * Инициализирует плавный скролл к якорям
 * @param {string} menuLinksSelector - Селектор ссылок меню
 * @param {number} scrollOffset - Отступ от верха (px)
 * @param {number} duration - Длительность анимации (ms)
 */
function initSmoothScroll(
    menuLinksSelector = '.js-scroll-to',
    scrollOffset = 0,
    duration = 800,
    burgerMenuInstance = null
) {
    // Проверка параметров
    if (typeof menuLinksSelector !== 'string' || typeof scrollOffset !== 'number' || typeof duration !== 'number') {
        console.error('Invalid parameters for smooth scroll initialization');
        return;
    }

    const links = document.querySelectorAll(menuLinksSelector);

    // Проверка наличия ссылок
    if (!links.length) {
        console.warn(`No elements found with selector "${menuLinksSelector}"`);
        return;
    }

    /**
     * Плавный скролл к элементу
     * @param {HTMLElement} targetElement - Целевой элемент
     */
    function smoothScrollTo(targetElement) {
        if (!targetElement) return;

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - scrollOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        /**
         * Анимация скролла
         * @param {number} timestamp - Временная метка
         */
        function animation(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            window.scrollTo(0, startPosition + distance * easeInOutCubic(percentage));

            if (progress < duration) {
                window.requestAnimationFrame(animation);
            }
        }

        /**
         * Плавность скролла
         */
        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        window.requestAnimationFrame(animation);
    }

    // Обработчик клика
    function handleLinkClick(e) {
        const href = this.getAttribute('href');

        // Проверяем, является ли ссылка якорем
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Закрываем бургер-меню, если оно открыто и передан экземпляр
                if (burgerMenuInstance && burgerMenuInstance.state.isOpen) {
                    burgerMenuInstance.closeMenu();
                }

                // небольшая задержка для закрытия меню перед скроллом
                setTimeout(() => {
                    smoothScrollTo(targetElement);
                    // Обновляем URL без перезагрузки страницы
                    history.pushState(null, null, href);
                }, 100);
            } else {
                console.warn(`Target element with id "${targetId}" not found`);
            }
        }
    }

    // Добавляем обработчики
    links.forEach(link => {
        link.addEventListener('click', handleLinkClick);
    });
}

class ScrollManager {
    constructor() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.lockCount = 0;
        this.savedStyles = {
            scrollPosition: 0,
            bodyPadding: '',
            scrollbarWidth: 0
        };
    }

    lockScroll() {
        console.log('window.pageYOffset || document.documentElement.scrollTop', window.pageYOffset || document.documentElement.scrollTop)
        if (this.lockCount === 0) {
            // Сохраняем текущее состояние
            this.savedStyles = {
                scrollPosition: window.pageYOffset || document.documentElement.scrollTop,
                bodyPadding: document.body.style.paddingTop,
                scrollbarWidth: this.getScrollbarWidth()
            };

            // Добавляем padding вместо скроллбара
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${this.savedStyles.scrollbarWidth}px`;

            // Фиксируем позицию без смещения
            document.body.style.position = 'relative';
            document.body.style.top = `${0}px`;

            // Для iOS
            if (this.isIOS) {
                document.body.classList.add('ios-scroll-fix');
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
            }
        }
        this.lockCount++;
    }

    unlockScroll() {
        if (this.lockCount <= 0) return;
        this.lockCount--;

        if (this.lockCount === 0) {
            // Восстанавливаем стили
            const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.style.width = '';

            // Для iOS
            if (this.isIOS) {
                document.body.classList.remove('ios-scroll-fix');
            }

            // Возвращаем скролл
            window.scrollTo(0, this.savedStyles.scrollPosition);
        }
    }

    getScrollbarWidth() {
        // Создаем временный элемент для измерения ширины скроллбара
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        document.body.appendChild(outer);

        const inner = document.createElement('div');
        outer.appendChild(inner);

        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

        outer.parentNode.removeChild(outer);
        return scrollbarWidth;
    }
}
const scrollManager = new ScrollManager();

class ModalManager {
    constructor() {
        this.scrollManager = new ScrollManager();
        this.initModals();
    }

    initModals() {
        // Открытие модалки
        document.querySelectorAll('[data-modal]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = e.currentTarget.getAttribute('data-modal');
                this.openModal(modalId, e.currentTarget);
            });
        });

        // Закрытие по крестику
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const modalBox = e.currentTarget.closest('.modal-box');
                this.closeModal(modalBox, false); // false - не из оверлея
            });
        });

        // Закрытие по оверлею (только прямой клик)
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                const modalBox = overlay.closest('.modal-box');
                this.closeModal(modalBox, false); // true - из оверлея
            });
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-box.active').forEach(modal => {
                    this.closeModal(modal, false);
                });
            }
        });
    }

    openModal(modalId, triggerButton) {
        const modalBox = document.getElementById(modalId);
        if (!modalBox) return;

        // Сохраняем нужно ли закрывать меню
        const closeMenu = triggerButton.getAttribute('data-close-menu') === 'true';
        modalBox.dataset.closeMenu = closeMenu;

        // Блокируем скролл (если еще не заблокирован)
        if (!document.querySelector('.menu-box._active')) {
            this.scrollManager.lockScroll();
        }

        // Открываем модалку
        modalBox.classList.add('active');

        // Закрываем меню только если явно указано
        if (closeMenu && document.querySelector('.header').classList.contains('_active')) {
            document.querySelector('.js-burger-btn')?.click();
        }

        // Загрузка контента если указан URL
        const contentUrl = triggerButton.getAttribute('data-modal-url');
        if (contentUrl) {
            this.loadModalContent(modalBox, contentUrl);
        }
    }

    closeModal(modalBox, fromOverlay) {
        if (!modalBox) return;

        const shouldCloseMenu = modalBox.dataset.closeMenu === 'true';

        // Закрываем модалку
        modalBox.classList.remove('active');

        // Разблокируем скролл только если меню не открыто
        if (!document.querySelector('.menu-box._active')) {
            this.scrollManager.unlockScroll();
        }

        // Закрываем меню только если:
        // 1. Явно указано (shouldCloseMenu)
        // 2. Закрытие не из оверлея ИЛИ нужно закрывать из оверлея
        if (shouldCloseMenu && !fromOverlay &&
            document.querySelector('.header').classList.contains('_active')) {
            document.querySelector('.js-burger-btn')?.click();
        }
    }

    loadModalContent(modalBox, url) {
        const contentContainer = modalBox.querySelector('.modal-content');
        if (!contentContainer) return;

        // Показываем индикатор загрузки
        contentContainer.innerHTML = `
            <div class="modal-loader">
                <div class="loader"></div>
            </div>
        `;

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.text();
            })
            .then(html => {
                contentContainer.innerHTML = html;
            })
            .catch(error => {
                contentContainer.innerHTML = `
                    <div class="modal-error">
                        <p>Произошла ошибка при загрузке</p>
                        <button onclick="location.reload()">Попробовать снова</button>
                    </div>
                `;
                console.error('Error loading modal content:', error);
            });
    }
}
// Обновленный обработчик кликов вне меню
function setupDocumentClickHandler() {
    document.addEventListener('click', (e) => {
        const menu = document.querySelector('.menu-box._active');
        const burgerBtn = document.querySelector('.js-burger-btn');
        const activeModal = document.querySelector('.modal-box.active');

        // Не закрываем меню если есть активная модалка
        if (activeModal) return;

        // Закрываем только при клике вне меню и не по кнопке бургера
        if (menu && !menu.contains(e.target) && !e.target.closest('.js-burger-btn')) {
            burgerBtn?.click();
        }
    });
}

/**
 * Меню-бургер с подменю и блокировкой скролла
 */
class BurgerMenu {
    constructor(options) {
        // Настройки по умолчанию
        const defaults = {
            burgerBtnSelector: '.js-burger-btn',
            menuSelector: '.menu-box',
            headerSelector: '.header',
            closeBtnSelector: '.js-burger-btn-close',
            submenuItemsSelector: '._has-subnemu',
            activeClass: '_active',
            lockBodyClass: '_lock',
            preventScrollOnIOS: true,
        };
        this.scrollbarWidth = this.getScrollbarWidth();
        this.scrollManager = scrollManager;
        // Объединяем настройки
        this.settings = { ...defaults, ...options };

        // Объект элментов DOM
        this.elements = {
            burgerBtn: document.querySelector(this.settings.burgerBtnSelector),
            menu: document.querySelector(this.settings.menuSelector),
            header: document.querySelector(this.settings.headerSelector),
            closeBtn: document.querySelector(this.settings.closeBtnSelector),
            submenuItems: document.querySelectorAll(this.settings.submenuItemsSelector),
            body: document.body,
        };

        // Состояние меню
        this.state = {
            isOpen: false,
        };

        this.init();
    }

    /**
     * Получаем ширину скроллбара
     * @return {number}
     *
     */
    getScrollbarWidth() {
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        document.body.appendChild(outer);

        const inner = document.createElement('div');
        outer.appendChild(inner);

        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
        outer.parentNode.removeChild(outer);

        return scrollbarWidth;
    }

    /**
     * Инициализация меню
     */
    init() {
        this.checkElements();
        this.addEventListeners();
    }

    /**
     * Проверка наличия необходимых элементов
     */
    checkElements() {
        const { burgerBtn, menu } = this.elements;

        if (!burgerBtn || !menu) {
            console.error('BurgerMenu: Не найдены необходимые элементы DOM');
            return false;
        }

        return true;
    }

    /**
     * Добавление обработчиков событий
     */
    addEventListeners() {
        const { burgerBtn, closeBtn, submenuItems } = this.elements;

        // Открытие/закрытие основного меню
        if (!burgerBtn)
            return

        burgerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMenu());
        }

        // Обработка подменю
        if (submenuItems.length) {
            submenuItems.forEach(item => {
                const link = item.querySelector('.top-menu__link');
                if (link) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleSubmenu(item);
                    });
                }
            });
        }

        // Единственный обработчик кликов вне меню
        document.addEventListener('click', (e) => {
            const activeModal = document.querySelector('.modal-box.active');

            // Не закрываем меню если есть активная модалка
            if (activeModal) return;

            // Проверяем клик вне меню и не по кнопке бургера
            if (!this.elements.menu.contains(e.target) &&
                !e.target.closest(this.settings.burgerBtnSelector)) {
                this.closeMenu();
            }
        });

        // Предотвращаем закрытие подменю при уводе курсора
        this.elements.menu.addEventListener('mouseleave', (e) => {
            // Не делаем ничего - подменю остается открытым
        });
    }
    toggleMenu() {
        if (this.state.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    /**
     * Открытие меню
     */
    openMenu() {
        if (this.state.isOpen) return;

        // Фиксируем скролл без скачка
        this.scrollManager.lockScroll();

        // Добавляем отступ справа для header
        if (this.elements.header) {
            this.elements.header.style.paddingRight = `${this.scrollbarWidth}px`;
        }

        // Открываем меню
        this.elements.menu.classList.add(this.settings.activeClass);
        this.elements.header.classList.add(this.settings.activeClass);
        this.state.isOpen = true;
    }

    /**
     * Закрытие меню
     */
    closeMenu() {
        if (!this.state.isOpen) return;

        // Закрываем меню
        this.elements.menu.classList.remove(this.settings.activeClass);
        this.elements.header.classList.remove(this.settings.activeClass);

        // Убираем отступ справа у header
        if (this.elements.header) {
            this.elements.header.style.paddingRight = '';
        }

        // Разблокируем скролл
        this.scrollManager.unlockScroll();

        this.closeAllSubmenus();
        this.state.isOpen = false;
    }

    /**
     * Переключение подменю
     * @param {HTMLElement} item - Элемент меню с подменю
     */
    toggleSubmenu(item) {
        // Закрываем другие подменю
        this.closeOtherSubmenus(item);
        // Переключаем текущее
        item.classList.toggle(this.settings.activeClass);
    }

    /**
     * Закрытие других подменю
     * @param {HTMLElement} currentItem - Текущий открытый элемент
     */
    closeOtherSubmenus(currentItem) {
        this.elements.submenuItems.forEach(item => {
            if (item !== currentItem) {
                console.log('closeOtherSubmenus')
                item.classList.remove(this.settings.activeClass);
            }
        });
    }

    /**
     * Закрытие всех подменю
     */
    closeAllSubmenus() {
        console.log('closeAllSubmenus')
        this.elements.submenuItems.forEach(item => {
            item.classList.remove(this.settings.activeClass);
        });
    }

    /**
     * Проверка iOS устройства
     * @return {boolean}
     */
    isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    /**
     * Блокировка скролла для iOS
     */
    disableIosScroll() {
        document.addEventListener('touchmove', this.preventDefault, { passive: false });
    }

    /**
     * Разблокировка скролла для iOS
     */
    enableIosScroll() {
        document.removeEventListener('touchmove', this.preventDefault);
    }

    /**
     * Предотвращение действия по умолчанию
     * @param {Event} e
     */
    preventDefault(e) {
        e.preventDefault();
    }
}

function updateVideoMask() {
    const svgNS = "http://www.w3.org/2000/svg";
    const mask = document.createElementNS(svgNS, "mask");
    mask.setAttribute("id", "video-mask");

    document.querySelectorAll('.video-window').forEach((window, index) => {
        const rect = document.createElementNS(svgNS, "rect");
        const rectPos = window.getBoundingClientRect();
        rect.setAttribute("x", rectPos.left);
        rect.setAttribute("y", rectPos.top);
        rect.setAttribute("width", window.offsetWidth);
        rect.setAttribute("height", window.offsetHeight);
        rect.setAttribute("fill", "white");
        mask.appendChild(rect);
    });

    const defs = document.querySelector('defs');
    defs.innerHTML = '';
    defs.appendChild(mask);
}

window.addEventListener('resize', updateVideoMask);

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.js-form form').forEach(form => initForm(form));
    initScrollHeader();
    const burgerMenu = new BurgerMenu({
        burgerBtnSelector: '.js-burger-btn',
        menuSelector: '.menu-box',
    });
    initSmoothScroll('.js-scroll-to', 0, 800, burgerMenu);
    modalManager = new ModalManager();
    setupDocumentClickHandler();
    updateVideoMask();
});